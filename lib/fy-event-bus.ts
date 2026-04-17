/**
 * Fy Event Bus - Barramento de eventos para o Fy reagir a ações do sistema
 * Implementação simples com EventEmitter pattern para React
 */

export type FyEvent =
  | { type: 'ponto:saved'; success: boolean }
  | { type: 'ponto:error' }
  | { type: 'notification:unread'; count: number }
  | { type: 'fy:hover' }
  | { type: 'fy:click' }
  | { type: 'fy:idle_start' }
  | { type: 'fy:idle_end' }
  | { type: 'fy:wake' }
  | { type: 'fy:celebrate' }
  | { type: 'fy:alert' }

type FyEventHandler = (event: FyEvent) => void

class FyEventBus {
  private listeners: Set<FyEventHandler> = new Set()

  subscribe(handler: FyEventHandler): () => void {
    this.listeners.add(handler)
    return () => {
      this.listeners.delete(handler)
    }
  }

  emit(event: FyEvent): void {
    this.listeners.forEach((handler) => {
      try {
        handler(event)
      } catch (error) {
        console.error('[FyEventBus] Error in event handler:', error)
      }
    })
  }

  clear(): void {
    this.listeners.clear()
  }
}

// Singleton instance
const fyEventBus = new FyEventBus()

/**
 * Emite um evento para o Fy
 */
export function fyEmit(event: FyEvent): void {
  fyEventBus.emit(event)
}

/**
 * Hook para componentes consumirem eventos do Fy
 */
export function useFyEventSubscription(callback: (event: FyEvent) => void): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableCallback = callback

  // eslint-disable-next-line react-hooks/exhaustive-deps
  import('react').then(({ useEffect }) => {
    useEffect(() => {
      const unsubscribe = fyEventBus.subscribe(stableCallback)
      return unsubscribe
    }, [stableCallback])
  })
}

// Export para uso direto em hooks
export { fyEventBus }
