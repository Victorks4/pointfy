/** Aguarda elemento do tour no DOM (após navegação / loading). */
export async function waitForTourAnchor(
  anchorId: string | null | undefined,
  timeoutMs = 4500,
): Promise<boolean> {
  if (!anchorId) return true
  if (typeof document === 'undefined') return false

  const deadline = Date.now() + timeoutMs

  return new Promise((resolve) => {
    const tick = () => {
      const el = document.querySelector(`[data-fy-anchor="${anchorId}"]`)
      if (el instanceof HTMLElement) {
        resolve(true)
        return
      }
      if (Date.now() >= deadline) {
        resolve(false)
        return
      }
      window.requestAnimationFrame(tick)
    }
    tick()
  })
}
