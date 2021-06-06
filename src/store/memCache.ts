import * as f from 'utils/function'
import { mutate } from 'utils/path'
import type { Store } from '.'

export const _ = Symbol('deferred')

export default abstract class MemCache<T> {
  constructor(protected readonly store: Store) {
    queueMicrotask(async () => {
      await this.init()
      this.assertComplete()
      this.resolveInit()
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
      this.store.handler(this.root as any).set((v, path) => {
        if (path === this.root) this.state = v
        else
          mutate(this.state, v, ...path.slice(this.root.length + 1).split('.'))
      }, true)
    )
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
}

export type OptPrim<T extends { [K in any]: any }> = {
  [K in keyof T]: T[K] extends Primitive ? T[K] | typeof _ : OptPrim<T[K]>
}
