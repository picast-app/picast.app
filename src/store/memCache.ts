import * as f from 'utils/function'
import { mutate } from 'utils/path'
import type { Store } from '.'
import type { Flatten, Schema } from './types'
import { Synchronized } from './tabSync'

export const _ = Symbol('deferred')

export type HookDict<T, F = Flatten<T>> = {
  [K in keyof F]?: (v: F[K]) => any
} & { $?: (v: T) => any }

export type FBDict<T, F = Flatten<T>> = { [K in keyof F]?: () => F[K] }
export type GetDict<T, F = Flatten<T>> = {
  [K in keyof F]?: (...subs: string[]) => MaybeProm<F[K]>
}

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
    this.attachGetters()
    this.attachSetter()
    this.attachFBs()
  }

  public destruct() {
    f.callAll(this.cleanupCBs)
  }

  // revalidate & attach handlers after schema change
  protected async reattach() {
    await this.store.handlersDone()
    f.callAll(this.cleanupCBs)
    this.assertComplete(this.state)
    this.attachGetters()
    this.attachSetter()
  }

  protected abstract readonly root: string
  abstract state: OptPrim<T>
  protected hooks: HookDict<T> = {}
  protected fbs: FBDict<T> = {}
  protected sync?: string
  protected cstGet: GetDict<T> = {}

  protected init(): Promise<any> | any {}
  private resolveInit!: (v: T) => void
  protected initialized = new Promise<T>(res => {
    this.resolveInit = res
  })

  private cleanupCBs: (() => any)[] = []

  private attachGetters() {
    this.cleanupCBs.push(
      this.store.handler(this.root as any).get(async () => {
        await this.initialized
        return this.state
      })
    )
    const attachNode = (node: any = this.state, path = this.root) => {
      for (const key of Object.keys(node)) {
        const keyPath = `${path}.${key}` as any
        this.cleanupCBs.push(
          this.store.handler(keyPath).get(async (_, ...subs) => {
            await this.initialized
            return (node[key] ??= await (this.cstGet as any)[keyPath]?.(
              ...subs
            ))
          })
        )
        if (typeof node[key] === 'object' && node[key] !== null)
          attachNode(node[key], `${path}.${key}`)
      }
    }
    if (typeof this.state === 'object' && this.state !== null) attachNode()
  }

  private attachSetter() {
    this.cleanupCBs.push(
      this.store.handler(this.root as any).set(this.onSet.bind(this), true)
    )
  }

  private attachFBs() {
    for (const [k, fb] of Object.entries(this.fbs))
      this.cleanupCBs.push(
        this.store.handler(`${this.root}.${k}` as any).fallback(fb as any)
      )
  }

  private onSet(v: any, path: string, meta?: Record<string, any>) {
    path = path.slice(this.root.length + 1)
    if (!path) {
      this.state = v
      this.hooks.$?.(v)
    } else if (mutate(this.state as any, v, ...path.split('.')) !== v)
      (this.hooks as any)[path]?.(v)

    if (!meta?.reflection) this.syncer?.broadcast({ path, v })
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
}

type Opt<T> = T | typeof _

export type OptPrim<T> = T extends Schema
  ? { [K in keyof Omit<T, '*'>]: OptPrim<T[K]> }
  : Opt<T>
