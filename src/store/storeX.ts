import * as path from 'utils/path'

type Schema = { [K: string]: Schema | string | number | boolean }

type Prefix<T, P extends string> = {
  [K in keyof T]: K extends string ? { [S in `${P}.${K}`]: T[K] } : never
}[keyof T]

export type FlatSchema<T> = T extends Schema
  ? T &
      MergeDistr<
        NonNullable<
          {
            [K in keyof T]: K extends string
              ? Prefix<FlatSchema<T[K]>, K>
              : never
          }[keyof T]
        >
      >
  : never

export default class Store<T extends Schema, TF = FlatSchema<T>> {
  public get<K extends keyof TF & string>(key: K): TF[K] {
    for (const [k, { get }] of this.handlers)
      if (key.startsWith(k) && get) return Store.pick(get(key), k, key)
    throw Error(`no get handler for '${key}' registered`)
  }

  public set<K extends keyof TF & string>(key: K, value: TF[K]) {
    for (let i = 0; i < this.handlers.length; i++) {
      if (!key.startsWith(this.handlers[i][0])) continue
      for (const handler of this.handlers[i][1].set)
        if (handler(value, key) === false) return
    }
    // propagate down into children
    for (let i = this.handlers.length - 1; i >= 0; i--) {
      if (
        this.handlers[i][0].length <= key.length ||
        !this.handlers[i][0].startsWith(key)
      )
        continue
      const sub = Store.pick(value, key, this.handlers[i][0], true)
      if (sub !== path.none) {
        for (const handler of this.handlers[i][1].set) handler(sub, key)
      } else {
        let o = 0
        while (
          i - o > 0 &&
          this.handlers[i - o - 1][0].startsWith(this.handlers[i][0] + '.')
        )
          o++

        for (let i2 = i - o; i2 <= i; i2++)
          for (const handler of this.handlers[i2][1].del)
            handler(this.handlers[i][0])

        i -= o
      }
    }
  }

  public merge<K extends keyof TF & string>(key: K, value: Partial<TF[K]>) {
    tips: for (const [tip, v] of Store.tips(value, key + '.')) {
      for (const [path, { set }] of this.handlers) {
        if (!tip.startsWith(path)) continue
        for (const handler of set) if (handler(v, tip) === false) continue tips
      }
    }
  }

  // handler map in reverse alphabetical order
  private handlers: [
    string,
    { get?: Getter; set: Setter[]; del: Deleted[] }
  ][] = []

  public handler<K extends keyof TF & string>(key: K) {
    const handlers = this.handlers
    const accessor = () => {
      let i = handlers.findIndex(([k]) => k <= key)
      if (i < 0) i = handlers.length
      if (handlers[i]?.[0] !== key)
        handlers.splice(i, 0, [key, { set: [], del: [] }])
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
      delete(handler: Deleted) {
        accessor().del.push(handler)
      },
    }
  }

  private static pick(
    obj: any,
    root: string,
    select: string,
    returnNone = false
  ) {
    if (root === select) return obj
    const value = path.pick(obj, ...select.slice(root.length + 1).split('.'))
    if (value === path.none) {
      if (returnNone) return path.none
      throw Error(`path '${root}' does not contain '${select}'`)
    }
    return value
  }

  private static tips(obj: any, prefix = ''): [string, any][] {
    return Object.entries(obj).flatMap(([k, v]) =>
      typeof v === 'object' && v !== null
        ? Store.tips(v, `${prefix}${k}.`)
        : [[prefix + k, v]]
    )
  }
}

type Getter<T = any> = (path: string) => T
type Setter<T = any> = (v: T, path: string) => unknown
type Deleted = (path: string) => unknown
