import { callAll } from './function'

export type EventDef = { [K: string]: (...args: any[]) => void }

export default class EventManager<T extends EventDef> {
  protected listeners: { [K in keyof T]?: T[K][] } = {}

  public addEventListener<K extends keyof T>(event: K, handler: T[K]) {
    ;(this.listeners[event] ??= []).push(handler as never)
  }

  public removeEventListener<K extends keyof T>(event: K, handler: T[K]) {
    this.listeners[event] = this.listeners[event]?.filter(f => f !== handler)
  }

  public async call<K extends keyof T>(event: K, ...payload: Parameters<T[K]>) {
    if (!(event in this.listeners)) return
    await Promise.all(callAll(this.listeners[event]!, ...payload))
  }
}
