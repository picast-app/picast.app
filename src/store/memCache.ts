import * as f from 'utils/function'
import { mutate } from 'utils/path'
import type { Store } from '.'
import type { Schema, FlatSchema } from './storeX'
import { Synchronized } from './tabSync'

export const _ = Symbol('deferred')

export type HookDict<T extends Schema, F = FlatSchema<T>> = {
  [K in keyof F]?: (v: F[K]) => any
}

export default abstract class MemCache<T extends Schema> {
  constructor(protected readonly store: Store) {
    queueMicrotask(async () => {
      await this.init()
      this.assertComplete()
      this.resolveInit()
      this.setupSync()
    })
  }

  public construct() {
    this.attachGetters()
    this.attachSetter()
  }

  public destruct() {
    f.callAll(this.cleanupCBs)
  }

  protected abstract readonly root: string
  abstract state: OptPrim<T>
  protected hooks: HookDict<T> = {}
  protected sync?: string

  protected init(): Promise<any> | any {}
  private resolveInit!: () => void
  private initialized = new Promise<void>(res => {
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
        this.cleanupCBs.push(
          this.store.handler(`${path}.${key}` as any).get(async () => {
            await this.initialized
            return node[key]
          })
        )
        if (typeof node[key] === 'object' && node[key] !== null)
          attachNode(node[key], `${path}.${key}`)
      }
    }
    attachNode()
  }

  private attachSetter() {
    this.cleanupCBs.push(
      this.store.handler(this.root as any).set(this.onSet.bind(this), true)
    )
  }

  private onSet(v: any, path: string, meta?: Record<string, any>) {
    path = path.slice(this.root.length + 1)
    if (!path) this.state = v
    else if (mutate(this.state, v, ...path.split('.')) !== v)
      this.hooks[path]?.(v)

    if (!meta?.reflection) this.syncer?.broadcast({ path, v })
  }

  private assertComplete(node: any = this.state, ...path: string[]) {
    if (node === _)
      throw Error(
        `incomplete memcache initialization ('${[this.root, ...path].join(
          '.'
        )}' not defined)`
      )
    if (typeof node !== 'object' || node === null) return
    Object.entries(node).forEach(([k, v]) => this.assertComplete(v, ...path, k))
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

export type OptPrim<T extends { [K in any]: any }> = {
  [K in keyof T]: T[K] extends Primitive ? T[K] | typeof _ : OptPrim<T[K]>
}
