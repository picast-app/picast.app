import { key } from 'fiber/wellKnown'
import type { Proxied } from 'fiber'
import type { Episode } from 'store/state'
import { isPromise } from 'utils/promise'
import { store as storeX } from 'store'
import { callAll } from 'utils/function'

// keeps track of subscribers per index
export abstract class Base {
  constructor(public readonly id = ((Math.random() * 1e6) | 0).toString(36)) {}

  protected subs: Proxied<λ<[Episode]>>[][] = []

  public addSub(index: number, update: Proxied<λ<[Episode]>>): λ<[], void> {
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
  protected indexMap: string[] = []
  protected keyMap: Record<string, number> = {}

  protected listen(id: string) {
    this.episodeListeners[id] ??= storeX
      .handler('episodes.*', id)
      .set(async (_, p, { unlock }) => {
        unlock?.()
        const episode = await storeX.get('episodes.*', id)
        if (episode) callAll(this.subs[this.keyMap[id]], episode)
      })
  }

  protected stopListen(id: string) {
    this.episodeListeners[id]()
    delete this.episodeListeners[id]
  }

  protected abstract onSub(index: number, update: λ<[Episode]>): void
  protected abstract onEstablishedSub(index: number): any
  protected onRemovedSub(index: number) {
    this.stopListen(this.indexMap[index])
  }
}
