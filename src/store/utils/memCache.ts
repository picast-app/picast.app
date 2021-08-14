import * as f from 'utils/function'
import { mutate, pick, paths } from 'utils/path'
import type { Store } from 'store'
import type { Flatten, Schema } from 'store/core/types'
import { Synchronized } from './tabSync'
import equals from 'snatchblock/equal'

export const _ = Symbol('deferred')

export type HookDict<T, F = Flatten<T>> = {
  [K in keyof F]?: (v: F[K]) => any
} & { $?: (v: T) => any }

export type FBDict<T, F = Flatten<T>> = { [K in keyof F]?: () => F[K] }
export type GetDict<T, F = Flatten<T>> = {
  [K in keyof F]?: (...subs: string[]) => MaybeProm<F[K]>
}

// todo: support wildcard paths
export default abstract class MemCache<T> {
  constructor(protected readonly store: Store) {
    queueMicrotask(async () => {
      await this.init()
      this.assertComplete(this.state)
      this.resolveInit(this.state as T)
      this.setupSync()
    })
  }

  public construct() {
    this.attachHandlers()
    this.attachFBs()
  }

  public destruct() {
    f.callAll(this.cleanupCBs)
  }

  // revalidate & attach handlers after schema change
  protected reattach() {
    f.callAll(this.cleanupCBs)
    this.assertComplete(this.state)
    this.attachHandlers()
  }

  protected abstract readonly root: string
  abstract state: OptPrim<T>
  protected hooks: HookDict<T> = {}
  protected fbs: FBDict<T> = {}
  protected sync?: string

  protected init(): Promise<any> | any {}
  private resolveInit!: (v: T) => void
  protected initialized = new Promise<T>(res => {
    this.resolveInit = res
  })

  private cleanupCBs: (() => any)[] = []

  private attachHandlers() {
    this.forEachNode((path, sub) => {
      this.cleanupCBs.push(
        this.store.handler(path as any).get(async () => {
          await this.initialized
          return pick(this.state as any, ...sub)
        }),

        this.store.handler(path as any).set((v, p, meta) => {
          if (p !== path) return
          if (equals(mutate(this, v, 'state', ...sub), v)) return false
          ;(this.hooks as any)[sub.join('.') || '$']?.(v)
          if (!meta?.reflection) this.syncer?.broadcast({ path, v })
        })
      )
    })
  }

  private attachFBs() {
    for (const [k, fb] of Object.entries(this.fbs))
      this.cleanupCBs.push(
        this.store.handler(`${this.root}.${k}` as any).fallback(fb as any)
      )
  }

  private assertComplete<TN>(node: TN, ...path: string[]) {
    if ((node as any) === _)
      throw Error(
        `incomplete memcache initialization ('${[this.root, ...path].join(
          '.'
        )}' not defined)`
      )
    if (typeof node !== 'object' || node === null) return
    Object.entries(node).forEach(([k, v]) => this.assertComplete(v, ...path, k))
    return
  }

  private syncer?: Synchronized
  private setupSync() {
    if (!this.sync || this.syncer) return
    this.syncer = new Synchronized(this.sync)
    this.syncer.onSync = ({ path, v }) => {
      logger.info('memcache sync', path, v)
      this.store.set(`${this.root}.${path}` as any, v, { reflection: true })
    }
  }

  private forEachNode(cb: (path: string, sub: string[]) => any) {
    const root = this.root.split('.')
    for (const path of [root, ...paths(this.state, ...root)])
      cb(path.join('.'), path.slice(root.length))
  }
}

type Opt<T> = T | typeof _

export type OptPrim<T> = T extends Schema
  ? { [K in keyof Omit<T, '*'>]: OptPrim<T[K]> }
  : Opt<T>
