'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { FyAnimationPhase } from '@/lib/fy-mascot'

const GREY_PANEL = '#e4e6eb'
const BLUE_BODY = '#2563eb'
const BLUE_DEEP = '#1e40af'
const BORDER_CYAN = '#7dd3fc'
const DARK_FACE = '#0f172a'
const ACCENT_EMIT = '#38bdf8'

export type FyCharacterProps = {
  phase: FyAnimationPhase
  pointAngleRad: number
  celebrateNonce: number
}

export function FyCharacter({ phase, pointAngleRad, celebrateNonce }: FyCharacterProps) {
  const rootRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Group>(null)
  const armRef = useRef<THREE.Group>(null)
  const hourRef = useRef<THREE.Group>(null)
  const minuteRef = useRef<THREE.Group>(null)
  const secondRef = useRef<THREE.Group>(null)
  const celebrateNonceRef = useRef(celebrateNonce)
  const celebrateT0Ref = useRef<number | null>(null)

  const handMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BORDER_CYAN,
        roughness: 0.25,
        metalness: 0.5,
        emissive: new THREE.Color(ACCENT_EMIT),
        emissiveIntensity: 0.22,
      }),
    [],
  )

  const ledMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: ACCENT_EMIT,
        emissive: new THREE.Color(ACCENT_EMIT),
        emissiveIntensity: 0.75,
        toneMapped: false,
      }),
    [],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const root = rootRef.current
    const body = bodyRef.current
    const arm = armRef.current
    if (!root || !body) return

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return

    const d = new Date()
    const ms = d.getMilliseconds() / 1000
    const sec = d.getSeconds() + ms
    const min = d.getMinutes() + sec / 60
    const hr = (d.getHours() % 12) + min / 60

    if (secondRef.current) {
      secondRef.current.rotation.z = -(sec / 60) * Math.PI * 2
    }
    if (minuteRef.current) {
      minuteRef.current.rotation.z = -(min / 60) * Math.PI * 2
    }
    if (hourRef.current) {
      hourRef.current.rotation.z = -(hr / 12) * Math.PI * 2
    }

    if (celebrateNonce !== celebrateNonceRef.current) {
      celebrateNonceRef.current = celebrateNonce
      celebrateT0Ref.current = t
    }

    let breathe = 1 + Math.sin(t * 2.6) * 0.028
    let rotZ = 0
    let yOff = 0

    if (phase === 'alert') {
      rotZ = Math.sin(t * 9) * 0.06
      breathe *= 1.025
    }

    const ct0 = celebrateT0Ref.current
    if (ct0 !== null) {
      const dt = t - ct0
      if (dt < 1.05) {
        yOff = Math.sin(dt * Math.PI) * 0.22
        breathe += Math.sin(dt * Math.PI * 2) * 0.05
      }
      if (dt > 1.35) celebrateT0Ref.current = null
    }

    if (phase === 'celebrate' && ct0 === null) {
      breathe += Math.sin(t * 12) * 0.035
    }

    body.rotation.z = THREE.MathUtils.lerp(body.rotation.z, rotZ, 0.12)
    body.scale.setScalar(breathe)
    body.position.y = THREE.MathUtils.lerp(body.position.y, yOff, 0.22)

    root.rotation.y = Math.sin(t * 0.55) * (phase === 'idle' ? 0.07 : 0.04)

    if (arm) {
      const base = -0.42
      const aim =
        phase === 'pointing' || phase === 'explaining'
          ? base + THREE.MathUtils.clamp(pointAngleRad * 0.42, -0.75, 0.88)
          : base + 0.12
      arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, aim, 0.1)
    }
  })

  return (
    <group ref={rootRef} position={[0, -0.04, 0]} scale={0.78}>
      <group ref={bodyRef}>
        <RoundedBox args={[1.0, 1.16, 0.38]} radius={0.15} smoothness={5} position={[0, 0, -0.03]}>
          <meshStandardMaterial
            color={BORDER_CYAN}
            roughness={0.32}
            metalness={0.42}
            emissive={BORDER_CYAN}
            emissiveIntensity={0.1}
          />
        </RoundedBox>

        <RoundedBox args={[0.9, 1.06, 0.36]} radius={0.13} smoothness={5} position={[0, 0, 0.025]}>
          <meshStandardMaterial color={BLUE_BODY} roughness={0.36} metalness={0.24} />
        </RoundedBox>

        <RoundedBox args={[0.8, 0.5, 0.07]} radius={0.09} smoothness={4} position={[0, 0.27, 0.195]}>
          <meshStandardMaterial color={GREY_PANEL} roughness={0.42} metalness={0.18} />
        </RoundedBox>

        <mesh position={[0, -0.14, 0.2]} scale={[0.4, 0.26, 0.34]}>
          <sphereGeometry args={[0.5, 28, 20]} />
          <meshStandardMaterial color={BLUE_DEEP} roughness={0.38} metalness={0.28} />
        </mesh>

        <mesh position={[0, 0.28, 0.218]}>
          <ringGeometry args={[0.13, 0.19, 48]} />
          <meshStandardMaterial color={DARK_FACE} roughness={0.48} metalness={0.38} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.28, 0.225]}>
          <circleGeometry args={[0.125, 40]} />
          <meshStandardMaterial color={DARK_FACE} roughness={0.55} metalness={0.2} />
        </mesh>

        <group position={[0, 0.28, 0.232]}>
          <group ref={hourRef}>
            <mesh position={[0, 0.048, 0]} material={handMat}>
              <boxGeometry args={[0.026, 0.085, 0.01]} />
            </mesh>
          </group>
          <group ref={minuteRef}>
            <mesh position={[0, 0.062, 0.004]} material={handMat}>
              <boxGeometry args={[0.02, 0.115, 0.009]} />
            </mesh>
          </group>
          <group ref={secondRef}>
            <mesh position={[0, 0.068, 0.008]} material={ledMat}>
              <boxGeometry args={[0.01, 0.095, 0.006]} />
            </mesh>
          </group>
          <mesh position={[0, 0, 0.012]}>
            <cylinderGeometry args={[0.022, 0.022, 0.018, 16]} />
            <meshStandardMaterial color={BLUE_DEEP} metalness={0.35} roughness={0.4} />
          </mesh>
        </group>

        <mesh position={[-0.26, 0.36, 0.19]} material={ledMat}>
          <sphereGeometry args={[0.026, 12, 12]} />
        </mesh>
        <mesh position={[0.26, 0.36, 0.19]} material={ledMat}>
          <sphereGeometry args={[0.026, 12, 12]} />
        </mesh>

        <mesh position={[0, 0.51, 0.14]} rotation={[0.25, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.011, 0.13, 8]} />
          <meshStandardMaterial color={GREY_PANEL} roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.585, 0.1]} material={ledMat}>
          <sphereGeometry args={[0.02, 10, 10]} />
        </mesh>

        <group ref={armRef} position={[-0.5, 0.02, 0.22]} rotation={[0, 0, -0.5]}>
          <mesh position={[0, -0.11, 0]} rotation={[0, 0, 0.14]}>
            <capsuleGeometry args={[0.052, 0.26, 6, 10]} />
            <meshStandardMaterial color={BLUE_BODY} roughness={0.36} metalness={0.26} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
