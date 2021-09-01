import * as pth from 'utils/path'
import { callAll } from 'utils/function'
import { promiseCB } from 'utils/promise'
import { flag } from 'utils/state'
import PathTree from './pathTree'
import type { Flatten } from './types'

export type Schema = { [K: string]: Schema | any }

export type Key<T extends Schema> = keyof Flatten<T>
export type Value<T extends Schema, K extends Key<T>> = Flatten<T>[K]

export default class Store<T extends Schema, TF = Flatten<T>> {
  public get<K extends keyof TF & string>(
    key: K,
    ...subs: string[]
  ): GetResolver<TF[K], T, TF> {
    return new GetResolver<TF[K], T, TF>(
      this,
      promiseCB(async () => {
        const final = this.substituteWildcards(key, ...subs)

        for (const [k, { get }] of this.handlers.rln)
          if (key.startsWith(k) && get)
            return this.pick(await get(final, ...subs), k, key)

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
    const [skip, noChange] = flag()
    const m = { ...meta, noChange, unlock: () => {} }

    if (process.env.BRANCH !== 'master')
      ((globalThis as any).storeTransactions ??= []).push({
        time: new Date().toISOString(),
        key,
        value,
      })

    const blocked = this.createBlockSet()

    const matches = (handler: λ) => {
      if (blocked.has(handler)) return false
      const filters = this.substitutionFilters.get(handler)
      return !filters || !filters.some((v, i) => subs[i] !== v)
    }

    // call setters where path=key or path includes key (high->low specificity)
    // stop if handler returns `false` or calls `noChange`
    for (const [path, { set }] of this.handlers.rln) {
      if (!key.startsWith(path)) continue
      for (const handler of set)
        if (matches(handler))
          if (handler(value, final, m, ...subs) === false || skip)
            return void this.blockSets.delete(blocked)
    }

    // search handlers where path is child of key (low->high specificity)
    // if path in value: call setters
    // otherwise: call delete for path and children of path (high->low specificity)
    for (const [path, { set }] of this.handlers.nlr) {
      if (path.length <= key.length || !path.startsWith(key)) continue
      const sub = this.pick(value, key, path, true)
      if (sub !== pth.none) {
        for (const handler of set)
          if (matches(handler)) handler(sub, final, m, ...subs)
      } else {
        let last = path
        for (const [k] of this.handlers.nlr.from(path))
          if (!k.startsWith(path)) break
          else last = path

        for (const [k, { del }] of this.handlers.rln.from(last)) {
          for (const handler of del) if (matches(handler)) handler(path)
          if (k === path) break
        }
      }
    }

    this.blockSets.delete(blocked)
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
      cancel = this.handler(key, ...subs).set(cb)
    })
    return () => {
      cancel?.()
    }
  }

  public async getJoined<
    K extends keyof TF & string,
    KJ extends keyof TF & string
  >(on: K, key: KJ): Promise<CondArr<TF[K], TF[KJ]>> {
    const joiner = await this.get(on)
    const list = Array.isArray(joiner) ? joiner : [joiner]

    const res = await Promise.all(
      list.map(k => {
        if (typeof k !== 'string') throw Error(`can't join on ${k}`)
        return this.get(key, k)
      })
    )
    return Array.isArray(joiner) ? res : (res[0] as any)
  }

  public listenJoined<
    K extends keyof TF & string,
    KJ extends keyof TF & string
  >(on: K, key: KJ, cb: Setter<CondArr<TF[K], TF[KJ]>>) {
    let cancelled = false
    let active: string[] = []
    let joiner: unknown

    const execJoin = async () => {
      const list = Array.isArray(joiner) ? joiner : [joiner]

      const res = await Promise.all(
        list.map(k => {
          if (typeof k !== 'string') throw Error(`can't join on ${k}`)
          return this.get(key, k)
        })
      )

      if (!cancelled)
        cb(Array.isArray(joiner) ? res : (res[0] as any), key, {}, ...list)

      active = list
    }

    const cancelSub = this.handler(key).set((v, p, m, k) => {
      queueMicrotask(() => {
        if (active.includes(k) && !cancelled) execJoin()
      })
    })

    const cancel = [cancelSub]

    const setup = async () => {
      joiner = await this.get(on)
      execJoin()

      cancel.push(
        this.handler(on).set((v, k) => {
          if (k !== on) return
          joiner = v
          execJoin()
        })
      )
    }
    setup()

    return () => {
      callAll(cancel)
      cancelled = true
    }
  }

  public merge<K extends keyof TF & string>(
    key: K,
    value: Partial<TF[K]>,
    ...subs: string[]
  ) {
    const blocked = this.createBlockSet()

    tips: for (const [tip, v] of Store.tips(value, key + '.')) {
      const [skip, noChange] = flag()
      const final = this.substituteWildcards(tip, ...subs)
      for (const [path, { set }] of this.handlers.rln) {
        if (!tip.startsWith(path)) continue
        for (const handler of set)
          if (!blocked.has(handler))
            if (handler(v, final, { noChange }, ...subs) === false || skip)
              continue tips
      }
    }

    this.blockSets.delete(blocked)
  }

  private handlers = new PathTree((): PathHandlers => ({ set: [], del: [] }))

  private substitutionFilters = new Map<λ, string[]>()

  private blockSets = new Set<Set<λ>>()
  private createBlockSet() {
    const set = new Set<λ>()
    this.blockSets.add(set)
    return set
  }
  private block(f: λ) {
    for (const set of this.blockSets) set.add(f)
  }

  // todo: handle substitution filters for handlers other than set
  public handler<K extends keyof TF & string>(key: K, ...subs: string[]) {
    const handlerFactory =
      <
        T extends (acc: PathHandlers, ...rest: R) => void,
        R extends [λ, ...any[]]
      >({
        attach,
        detach,
      }: {
        attach: T
        detach: (acc: PathHandlers, accArgs: R) => void
      }) =>
      (...args: R) => {
        this.block(args[0])
        this.substitutionFilters.set(args[0], subs)
        const acc = this.handlers.get(key)
        attach(acc, ...args)
        return () => {
          this.substitutionFilters.delete(args[0])
          detach(acc, args)
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

  private pick(obj: any, root: string, select: string, returnNone = false) {
    if (root === select) return obj
    const value = pth.pick(obj, ...select.slice(root.length + 1).split('.'))
    if (value === pth.none) {
      if (returnNone) return pth.none
      const fb = this.handlers.get(select).fallback
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

type PathHandlers = {
  get?: Getter
  fallback?: Fallback
  set: Setter[]
  del: Deleted[]
}

export type Getter<T = any> = (
  path: string,
  ...subs: string[]
) => T | Promise<T>
export type Setter<T = any> = (
  v: T,
  path: string,
  meta: Record<string, any> & { noChange?(): void; unlock?(): void },
  ...subs: string[]
) => unknown
export type Deleted = (path: string) => unknown
export type Fallback<T = any> = () => T

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
    const inter: any = await this

    const assertJoiner = (v: unknown) => {
      if (typeof v !== 'string') throw Error(`can't join on ${v}`)
    }

    if (Array.isArray(inter))
      return (await Promise.all(
        inter.map(k => (assertJoiner(k), this.store.get(path as any, k)))
      )) as any

    assertJoiner(inter)
    return (await this.store.get(path as any, inter)) as any
  }
}
