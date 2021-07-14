import { Base, CB } from './base'
import { store as storeX } from 'store'
import type { Podcast as PodStore } from 'main/store/episodeStore'

export class Podcast extends Base {
  constructor(private readonly store: PodStore) {
    super()
    store.onEpisode = (...indices) =>
      this.reattach(this.merge(this.store, ...indices))
  }

  private readonly podId = this.store.id

  async onSub(i: number, update: CB) {
    if (!this.indexMap[i]) return
    const episode = await storeX.get('episodes.*', this.indexMap[i][0])
    if (episode) update(episode)
  }

  async onEstablishedSub(i: number) {
    const id = await this.store.get(i)
    if (!id) return logger.warn(`no id found for [${i}] (${this.podId})`)

    this.setKey(i, id)
    this.key(id).i = i

    this.listen(id)
  }
}
