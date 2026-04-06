'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { FyCharacter } from '@/components/fy/fy-character'
import type { FyAnimationPhase } from '@/lib/fy-context'

export type FyCanvasProps = {
  phase: FyAnimationPhase
  pointAngleRad: number
  celebrateNonce: number
  /** Maior = personagem mais “zoomado” no enquadramento ortográfico. */
  cameraZoom?: number
}

export function FyCanvas({
  phase,
  pointAngleRad,
  celebrateNonce,
  cameraZoom = 120,
}: FyCanvasProps) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 6], zoom: cameraZoom, near: 0.1, far: 40 }}
      dpr={[1, 1.5]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      }}
      style={{ width: '100%', height: '100%', touchAction: 'none' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.72} />
        <directionalLight position={[5, 8, 10]} intensity={1.15} castShadow />
        <directionalLight position={[-4, -2, 6]} intensity={0.4} color="#7dd3fc" />
        <FyCharacter phase={phase} pointAngleRad={pointAngleRad} celebrateNonce={celebrateNonce} />
      </Suspense>
    </Canvas>
  )
}
