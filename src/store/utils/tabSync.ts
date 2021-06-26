export class Synchronized {
  private static readonly channel =
    'BroadcastChannel' in globalThis ? new BroadcastChannel('tabsync') : null

  constructor(protected readonly name: string) {
    Synchronized.channel?.addEventListener('message', ({ data }) => {
      try {
        const { target, payload } = JSON.parse(data)
        if (target !== this.name) return
        this.onSync?.(payload)
      } catch (e) {
        logger.warn('failed to parse message', data)
      }
    })
  }

  public broadcast(payload: any) {
    Synchronized.channel?.postMessage(
      JSON.stringify({ target: this.name, payload })
    )
  }

  public onSync?: (payload: any) => any
}
