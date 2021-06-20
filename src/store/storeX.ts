import * as path from 'utils/path'
import { callAll } from 'utils/function'
import { promiseCB } from 'utils/promise'
import type { Flatten } from './types'

export type Schema = { [K: string]: Schema | any }

export type Key<T extends Schema> = keyof Flatten<T>
export type Value<T extends Schema, K extends Key<T>> = Flatten<T>[K]

export default class Store<T extends Schema, TF = Flatten<T>> {
  constructor() {
    this.get = this.locked(this.get)
    this.set = this.locked(this.set)
    this.merge = this.locked(this.merge)
  }

  public get<K extends keyof TF & string>(
    key: K,
    ...subs: string[]
  ): GetResolver<TF[K], T, TF> {
    return new GetResolver<TF[K], T, TF>(
      this,
      promiseCB(async () => {
        const final = this.substituteWildcards(key, ...subs)

        for (const [k, { get }] of this.handlers)
          if (key.startsWith(k) && get) {
            this.escapeLock?.()
            return this.pick(await get(final, ...subs), k, key)
          }
        throw Error(`no get handler for '${key}' registered`)
      })
    )
  }

  public set<K extends keyof TF & string>(
    key: K,
    value: TF[K],
    meta: Record<string, any> = {},
    ...subs: string[]
  ) {
    const final = this.substituteWildcards(key, ...subs)

    for (let i = 0; i < this.handlers.length; i++) {
      if (!key.startsWith(this.handlers[i][0])) continue
      for (const handler of this.handlers[i][1].set)
        if (handler(value, final, meta, ...subs) === false) return
    }
    // propagate down into children
    for (let i = this.handlers.length - 1; i >= 0; i--) {
      if (
        this.handlers[i][0].length <= key.length ||
        !this.handlers[i][0].startsWith(key)
      )
        continue
      const sub = this.pick(value, key, this.handlers[i][0], true)
      if (sub !== path.none) {
        for (const handler of this.handlers[i][1].set)
          handler(sub, final, meta, ...subs)
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

  // get & register setter
  public listen<K extends keyof TF & string>(
    key: K,
    cb: Setter<TF[K]>,
    ...subs: string[]
  ): () => void {
    let cancel: () => void
    this.get(key, ...subs).then(v => {
      cb(v, key, {}, ...subs)
      cancel = this.handler(key).set(cb)
    })
    return () => {
      cancel?.()
    }
  }

  public merge<K extends keyof TF & string>(
    key: K,
    value: Partial<TF[K]>,
    ...subs: string[]
  ) {
    tips: for (const [tip, v] of Store.tips(value, key + '.')) {
      const final = this.substituteWildcards(tip, ...subs)
      for (const [path, { set }] of this.handlers) {
        if (!tip.startsWith(path)) continue
        for (const handler of set)
          if (handler(v, final, {}, ...subs) === false) continue tips
      }
    }
  }

  // handler map in reverse alphabetical order
  private handlers: [
    string,
    { get?: Getter; fallback?: Fallback; set: Setter[]; del: Deleted[] }
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
      fallback: handlerFactory({
        attach(acc, handler: Fallback<TF[K]>) {
          if (acc.fallback) throw Error(`'${key}' already has fallback`)
          acc.fallback = handler
        },
        detach(acc) {
          delete acc.fallback
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
      const noErr = Symbol()
      let err: unknown = noErr
      try {
        this.lockHandler()
        return meth(...args)
      } catch (e) {
        err = e
      } finally {
        if (!escaped) this.unlockHandler()
      }
      if (err !== noErr)
        throw Error(`error in [${meth.name}](${args.join(', ')}): ${err}`)
    }) as any).bind(this)
  }

  public afterHandlers(cb: () => any) {
    if (!this.handlerQueue) cb()
    else this.handlerQueue.push(cb)
  }
  public handlersDone(): Promise<void> {
    return new Promise(res => this.afterHandlers(res))
  }

  private pick(obj: any, root: string, select: string, returnNone = false) {
    if (root === select) return obj
    const value = path.pick(obj, ...select.slice(root.length + 1).split('.'))
    if (value === path.none) {
      if (returnNone) return path.none
      const fb = this.handlers.find(([p]) => p === select)?.[1].fallback
      if (fb) return fb()
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
  meta: Record<string, any>,
  ...subs: string[]
) => unknown
type Deleted = (path: string) => unknown
type Fallback<T = any> = () => T

class GetResolver<T, TC extends Schema, TF> extends Promise<T> {
  static get [Symbol.species]() {
    return Promise
  }

  constructor(
    private readonly store: Store<TC, TF>,
    exec: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: any) => void
    ) => any
  ) {
    super(exec)
  }

  public async join<K extends keyof TF>(path: K): Promise<CondArr<T, TF[K]>> {
    const inter = await this

    const assertJoiner = (v: unknown) => {
      if (typeof v !== 'string') throw Error(`can't join on ${v}`)
    }

    if (Array.isArray(inter))
      return (await Promise.all(
        inter.map(k => (assertJoiner(k), this.store.get(path as any, k)))
      )) as any

    assertJoiner(inter)
    return (await this.store.get(path as any, inter as any)) as any
  }
}
