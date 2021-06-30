import { callAll } from './function'

export const flag = (): [flag: boolean, set: () => void] => {
  let val = false
  const setter = () => {
    val = true
  }
  return [val, setter]
}

export class Machine<T extends string> {
  constructor(private state: T) {}

  public transition(to: T) {
    if (this.state === to) return
    const allowed = (this.allowed[this.state] ??= new Set())
    if (!allowed.has(to))
      throw Error(`can't transition from ${this.state} to ${to}`)
    const prev = this.state
    this.state = to
    callAll(this.listeners, to, prev)
  }

  public addTransition<TF extends T>(from: TF, to: Exclude<T, TF>) {
    ;(this.allowed[from] ??= new Set()).add(to)
  }

  public onChange(cb: λ<[to: T, from: T]>) {
    this.listeners.push(cb)
    return () => this.listeners.splice(this.listeners.indexOf(cb), 1)
  }

  public get current(): T {
    return this.state
  }

  private allowed: { [K in T]?: Set<T> } = {}
  private listeners: λ<[T, T]>[] = []
}
