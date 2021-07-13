import { Base } from './base'
import { store as storeX } from 'store'
import type { Episode } from 'store/state'
import type { Podcast as PodStore } from 'main/store/episodeStore'
import { callAll } from 'utils/function'

export class Podcast extends Base {
  constructor(private readonly store: PodStore) {
    super()
    store.onEpisode = async (...indices) => {
      indices = [...indices].sort()

      for (const i of indices) {
        for (let e = this.indexMap.length; e > i; e--) {
          this.indexMap[e] = this.indexMap[e - 1]
          this.keyMap[this.indexMap[e]] = e
        }
        this.indexMap[i] = this.store.read(i)
        this.keyMap[this.indexMap[i]] = i
      }

      for (let i = indices[0]; i < this.indexMap.length; i++) {
        if (this.subs[i]?.length) {
          const episode = await storeX.get('episodes.*', this.indexMap[i])
          if (!episode)
            throw Error(
              `no episode found for ${this.podId} ${this.indexMap[i]}`
            )
          callAll(this.subs[i], episode)
        } else {
          this.episodeListeners[this.indexMap[i]]()
          delete this.episodeListeners[this.indexMap[i]]
        }
      }
    }
  }

  private readonly podId = this.store.id

  async onSub(i: number, update: λ<[Episode]>) {
    if (!this.indexMap[i]) return
    const episode = await storeX.get('episodes.*', this.indexMap[i])
    if (episode) update(episode)
  }

  async onEstablishedSub(i: number) {
    const id = await this.store.get(i)
    if (!id) return logger.warn(`no id found for [${i}] (${this.podId})`)

    this.indexMap[i] = id
    this.keyMap[id] = i

    this.listen(id)
  }
}
