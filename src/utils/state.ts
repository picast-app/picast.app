import { callAll } from './function'

export const flag = (): [flag: boolean, set: () => void] => {
  let val = false
  const setter = () => {
    val = true
  }
  return [val, setter]
}

export class Machine<T extends Primitive> {
  constructor(private state: T) {}

  public transition(to: T) {
    if (this.state === to) return
    this.assertAllowed(to)
    const prev = this.state
    this.state = to
    callAll(this.listeners, to, prev)
  }

  public addTransition<TF extends T>(from: TF, to: Exclude<T, TF>) {
    let set = this.allowed.get(from)!
    if (!set) this.allowed.set(from, (set = new Set()))
    set.add(to)
  }

  public onChange(cb: λ<[to: T, from: T]>) {
    this.listeners.push(cb)
    return () => this.listeners.splice(this.listeners.indexOf(cb), 1)
  }

  public get current(): T {
    return this.state
  }

  private allowed = new Map<T, Set<T>>()
  private listeners: λ<[T, T]>[] = []

  protected assertAllowed(to: T) {
    if (this.state !== to && !this.allowed.get(this.state)?.has(to))
      throw Error(`can't transition from ${this.state} to ${to}`)
  }
}

export class DelayMachine<T extends Primitive> extends Machine<T> {
  public addTransition<TF extends T>(
    from: TF,
    to: Exclude<T, TF>,
    delay?: number
  ) {
    super.addTransition(from, to)
    if (delay) {
      let map = this.delays.get(from)!
      if (!map) this.delays.set(from, (map = new Map()))
      map.set(to, delay)
    }
  }

  private scheduled?: number

  public transition(to: T) {
    if ('scheduled' in this) clearTimeout(this.scheduled)
    if (!this.delays.get(this.current)?.has(to)) return super.transition(to)
    this.scheduled = setTimeout(
      () => super.transition(to),
      this.delays.get(this.current)!.get(to)
    )
  }

  private delays = new Map<T, Map<T, number>>()
}
