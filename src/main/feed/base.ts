import { key } from '@picast-app/fiber/wellKnown'
import type { Proxied } from '@picast-app/fiber'
import type { Episode } from 'store/state'
import { isPromise } from 'utils/promise'
import { store as storeX } from 'store'
import { callAll } from 'utils/function'
import type { Podcast as PodStore } from 'main/episodeStore'
import { nullSet } from 'utils/map'

export type CB = Proxied<λ<[Episode]>>

// keeps track of subscribers per index
export abstract class Base {
  constructor(public readonly id = Base.genId()) {
    Base.instances.set(id, this)
  }

  delete() {
    Base.instances.delete(this.id)
  }

  protected subs: CB[][] = []

  public addSub(index: number, update: CB): λ<[], void> {
    ;(this.subs[index] ??= []).push(update)
    const onSub = () => this.onSub(index, update)
    const v = this.subs[index].length === 1 && this.onEstablishedSub(index)
    if (isPromise(v)) v.then(onSub)
    else onSub()
    return () => {
      if (!this.subs[index]?.length) return
      let i: number
      while ((i = this.subs[index].findIndex(v => v[key] === update[key])) > -1)
        this.subs[index].splice(i, 1)
      if (this.subs[index].length) return
      this.onRemovedSub(index)
      delete this.subs[index]
    }
  }

  protected episodeListeners: { [id: string]: () => void } = {}
  protected indexMap: [string, number][] = []
  protected keyMap = new Map<string, { i?: number }>()

  protected listen(id: string) {
    this.episodeListeners[id] ??= storeX
      .handler('episodes.*', id)
      .set(async (_, p, { unlock }) => {
        unlock?.()
        const episode = await storeX.get('episodes.*', id)
        if (episode) callAll(this.subs[this.keyMap.get(id)!.i!], episode)
      })
  }

  protected stopListen(id: string) {
    this.episodeListeners[id]()
    delete this.episodeListeners[id]
  }

  protected abstract onSub(index: number, update: λ<[Episode]>): void
  protected abstract onEstablishedSub(index: number): any
  protected onRemovedSub(index: number) {
    this.stopListen(this.indexMap[index][0])
  }

  protected merge(
    store: PodStore,
    ...indices: [feedI: number, storeI: number][] | number[]
  ): number {
    let iPairs: [number, number][] =
      typeof indices[0] === 'number'
        ? indices.map(n => [n, n])
        : (indices as any)
    iPairs = [...iPairs].sort(([a], [b]) => a - b)
    for (const [i, si] of iPairs) {
      for (let e = this.indexMap.length; e > i; e--) {
        this.indexMap[e] = this.indexMap[e - 1]
        this.key(this.indexMap[e][0]).i = e
      }
      this.setKey(i, store.read(si))
      this.key(this.indexMap[i][0]).i = i
    }
    return iPairs[0][0]
  }

  protected async reattach(from: number) {
    for (let i = from; i < this.indexMap.length; i++) {
      if (this.subs[i]?.length) {
        const episode = await storeX.get('episodes.*', this.indexMap[i][0])
        if (!episode) throw Error(`no episode found for ${this.indexMap[i][0]}`)
        callAll(this.subs[i], episode)
      } else {
        this.episodeListeners[this.indexMap[i][0]]?.()
        delete this.episodeListeners[this.indexMap[i][0]]
      }
    }
  }

  protected key = (id: string) => nullSet(this.keyMap, id, {})
  protected static numeric = (key: string) => parseInt(key.slice(0, 6), 36)
  protected setKey(i: number, key: string) {
    this.indexMap[i] = [key, Base.numeric(key)]
  }

  protected searchIndex(key: number) {
    for (let i = 0; i < this.indexMap.length; i++)
      if (this.indexMap[i][1] <= key) return i
    return this.indexMap.length
  }

  public static readonly instances = new Map<string, Base>()
  private static genId = () => {
    do {
      const id = ((Math.random() * 1e6) | 0).toString(36)
      if (Base.instances.has(id)) continue
      return id
    } while (true)
  }
}
