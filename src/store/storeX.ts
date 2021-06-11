import * as path from 'utils/path'
import { callAll } from 'utils/function'

export type Schema = { [K: string]: Schema | any }

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

export type Key<T extends Schema> = keyof FlatSchema<T>
export type Value<T extends Schema, K extends Key<T>> = FlatSchema<T>[K]

export default class Store<T extends Schema, TF = FlatSchema<T>> {
  constructor() {
    this.get = this.locked(this.get)
    this.set = this.locked(this.set)
    this.merge = this.locked(this.merge)
  }

  public async get<K extends keyof TF & string>(
    key: K,
    ...subs: string[]
  ): Promise<TF[K]> {
    const final = this.substituteWildcards(key, ...subs)

    for (const [k, { get }] of this.handlers)
      if (key.startsWith(k) && get) {
        this.escapeLock?.()
        return Store.pick(await get(final, ...subs), k, key)
      }
    throw Error(`no get handler for '${key}' registered`)
  }

  public set<K extends keyof TF & string>(
    key: K,
    value: TF[K],
    meta?: Record<string, any>
  ) {
    for (let i = 0; i < this.handlers.length; i++) {
      if (!key.startsWith(this.handlers[i][0])) continue
      for (const handler of this.handlers[i][1].set)
        if (handler(value, key, meta) === false) return
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
        for (const handler of this.handlers[i][1].set) handler(sub, key, meta)
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
    type Accessor = ReturnType<typeof accessor>

    const handlerFactory = <
      T extends (acc: Accessor, ...rest: R) => void,
      R extends any[]
    >({
      attach,
      detach,
    }: {
      attach: T
      detach: (acc: Accessor, accArgs: R) => void
    }) => (...args: R) => {
      let acc: Accessor
      const apply = () => {
        acc = accessor()
        attach(acc, ...args)
      }
      if (this.handlerQueue) this.handlerQueue.push(apply)
      else apply()
      return () => {
        if (acc) detach(acc, args)
        else if (this.handlerQueue?.includes(apply))
          this.handlerQueue.splice(this.handlerQueue.indexOf(apply, 1))
      }
    }

    return {
      get: handlerFactory({
        attach(acc, handler: Getter<TF[K]>) {
          if (acc.get) throw Error(`'${key}' already has getter`)
          acc.get = handler
        },
        detach(acc) {
          delete acc.get
        },
      }),
      set: handlerFactory({
        attach({ set }, handler: Setter<TF[K]>, authoritative = false) {
          set[authoritative ? 'unshift' : 'push'](handler)
        },
        detach({ set }, [handler]) {
          set.splice(set.indexOf(handler), 1)
        },
      }),
      delete: handlerFactory({
        attach({ del }, handler: Deleted) {
          del.push(handler)
        },
        detach({ del }, [handler]) {
          del.splice(del.indexOf(handler), 1)
        },
      }),
    }
  }

  private handlerQueue?: (() => void)[]
  private lockHandler() {
    if (this.handlerQueue) throw Error('handler already locked')
    this.handlerQueue = []
  }
  private unlockHandler() {
    if (!this.handlerQueue) throw Error('handler already unlocked')
    callAll(this.handlerQueue)
    delete this.handlerQueue
  }

  private escapeLock?: () => void
  private locked<T extends (...args: any[]) => any>(meth: T): T {
    meth = meth.bind(this) as any
    return (((...args: Parameters<T>) => {
      let escaped = false
      this.escapeLock = () => {
        this.unlockHandler()
        escaped = true
      }
      try {
        this.lockHandler()
        return meth(...args)
      } finally {
        if (!escaped) this.unlockHandler()
      }
    }) as any).bind(this)
  }

  public afterHandlers(cb: () => any) {
    if (!this.handlerQueue) cb()
    else this.handlerQueue.push(cb)
  }
  public handlersDone(): Promise<void> {
    return new Promise(res => this.afterHandlers(res))
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
    if (typeof obj !== 'object' || obj === null)
      return [[prefix.replace(/\.$/, ''), obj]]
    return Object.entries(obj).flatMap(([k, v]) =>
      typeof v === 'object' && v !== null
        ? Store.tips(v, `${prefix}${k}.`)
        : [[prefix + k, v]]
    )
  }

  private substituteWildcards<T extends string>(path: T, ...wild: string[]): T {
    let match: number
    while ((match = path.indexOf('*')) >= 0) {
      if (!wild.length)
        throw Error(`missing substitution for '${path}' at ${match}`)
      path = (path.slice(0, match) +
        wild.shift() +
        path.slice(match + 1)) as any
    }
    if (wild.length)
      throw Error(
        `provided too many substitutions (${wild.join(', ')}) for '${path}'`
      )
    return path
  }
}

type Getter<T = any> = (path: string, ...subs: string[]) => T | Promise<T>
type Setter<T = any> = (
  v: T,
  path: string,
  meta?: Record<string, any>
) => unknown
type Deleted = (path: string) => unknown
