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
        for (let e = this.indexMap.length; e > i; e--)
          this.indexMap[e] = this.indexMap[e - 1]
        this.indexMap[i] = this.store.read(i)
      }

      for (let i = indices[0]; i < this.indexMap.length; i++) {
        if (this.subs[i]?.length) {
          const episode = await storeX.get(
            'episodes.*.*',
            this.podId,
            this.indexMap[i]
          )
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

  private episodeListeners: { [id: string]: () => void } = {}
  private indexMap: string[] = []

  async onSub(i: number, update: λ<[Episode]>) {
    const episode = await storeX.get(
      'episodes.*.*',
      this.podId,
      this.indexMap[i]
    )
    if (episode) update(episode)
  }

  async onEstablishedSub(i: number) {
    const id = await this.store.get(i)
    if (!id) return logger.warn(`no id found for [${i}] (${this.podId})`)

    this.indexMap[i] = id

    this.episodeListeners[id] ??= storeX
      .handler('episodes.*.*', this.podId, id)
      .set(async (_, p, { unlock }) => {
        const index = this.findIndex(id, i)
        if (index < 0 || !this.subs[index]?.length) return
        unlock?.()
        const episode = await storeX.get('episodes.*.*', this.podId, id)
        logger.info(id, '->', episode)
        if (episode) callAll(this.subs[i], episode)
      })
  }

  onRemovedSub(i: number) {
    const id = this.indexMap[i]
    this.episodeListeners[id]()
    delete this.episodeListeners[id]
  }

  private findIndex(id: string, startAt = 0) {
    for (let i = startAt; i < this.indexMap.length; i++)
      if (this.indexMap[i] === id) return i
    for (let i = startAt - 1; i >= 0; i--) if (this.indexMap[i] === id) return i
    return -1
  }
}
