export default abstract class EventManager<
  T extends { [K: string]: (...args: any[]) => void }
> {
  protected listeners: { [K in keyof T]?: T[K][] } = {}

  public addEventListener<K extends keyof T>(event: K, handler: T[K]) {
    ;(this.listeners[event] ??= []).push(handler as never)
  }

  public removeEventListener<K extends keyof T>(event: K, handler: T[K]) {
    this.listeners[event] = this.listeners[event]?.filter(f => f !== handler)
  }

  protected call<K extends keyof T>(event: K, ...payload: Parameters<T[K]>) {
    if (!(event in this.listeners)) return
    for (const listener of this.listeners[event]!) listener(...payload)
  }
}
