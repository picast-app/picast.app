import * as path from 'utils/path'

type Schema = { [K: string]: Schema | string | number | boolean }

type Prefix<T, P extends string> = {
  [K in keyof T]: K extends string ? { [S in `${P}.${K}`]: T[K] } : never
}[keyof T]

export type FlatSchema<T> = T extends Schema
  ? T &
      MergeDistr<
        {
          [K in keyof T]: K extends string ? Prefix<FlatSchema<T[K]>, K> : never
        }[keyof T]
      >
  : never

export default class Store<T extends Schema, TF = FlatSchema<T>> {
  public get<K extends keyof TF & string>(key: K): TF[K] {
    for (const [k, { get }] of this.handlers)
      if (key.startsWith(k) && get) return this.pick(get(key), k, key)
    throw Error(`no get handler for '${key}' registered`)
  }

  public set<K extends keyof TF & string>(key: K, value: TF[K]) {
    for (let i = 0; i < this.handlers.length; i++) {
      if (!key.startsWith(this.handlers[i][0])) continue
      for (const handler of this.handlers[i][1].set)
        if (handler(value, key) === false) return
    }
  }

  // handler map in reverse alphabetical order
  private handlers: [string, { get?: Getter; set: Setter[] }][] = []

  public handler<K extends keyof TF & string>(key: K) {
    const handlers = this.handlers
    const accessor = () => {
      let i = handlers.findIndex(([k]) => k <= key)
      if (i < 0) i = handlers.length
      if (handlers[i]?.[0] !== key) handlers.splice(i, 0, [key, { set: [] }])
      return handlers[i][1]
    }

    return {
      set get(handler: Getter<TF[K]>) {
        const acc = accessor()
        if (acc.get) throw Error(`'${key}' already has getter`)
        acc.get = handler
      },
      set(handler: Setter<TF[K]>, authoritative = false) {
        accessor().set[authoritative ? 'unshift' : 'push'](handler)
      },
    }
  }

  private pick(obj: any, root: string, select: string) {
    if (root === select) return obj
    const value = path.pick(obj, ...select.slice(root.length + 1).split('.'))
    if (value === path.none)
      throw Error(`path '${root}' does not contain '${select}'`)
    return value
  }
}

type Getter<T = any> = (path: string) => T
type Setter<T = any> = (v: T, path: string) => unknown
