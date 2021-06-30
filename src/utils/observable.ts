import { callAll } from './function'
import equals from './equal'

export default class Observable<T> {
  constructor(private _value: T) {}

  public get value() {
    return this._value
  }

  public set value(v: T) {
    this._value = v
    callAll(this.listeners, v)
  }

  private listeners: ((v: T) => any)[] = []

  public listen(listener: (v: T) => any) {
    this.listeners.push(listener)
    return () => {
      this.listeners.splice(this.listeners.indexOf(listener), 1)
    }
  }

  public waitFor(matcher: T | ((v: T) => boolean)): Promise<T> {
    return new Promise<T>(res => {
      if (this.is(matcher)) res(this.value)
      else {
        const done = this.listen(() => {
          if (!this.is(matcher)) return
          done()
          res(this.value)
        })
      }
    })
  }

  public is = (matcher: T | ((v: T) => boolean)): boolean =>
    typeof matcher === 'function'
      ? (matcher as λ)(this._value)
      : equals(this._value, matcher)
}
