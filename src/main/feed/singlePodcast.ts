import { Base, UpdateCB } from './base'
import type { Podcast as PodStore } from 'main/store/episodeStore'

export class Podcast extends Base {
  constructor(private readonly store: PodStore) {
    super()
    store.onEpisode = (...indices) => {
      for (let i = Math.min(...indices); i < this.subs.length; i++)
        this.store.get(i).then(v => this.subs[i].forEach(f => f(v!)))
    }
  }

  async onSub(i: number, update: UpdateCB) {
    const episode = await this.store.get(i)
    if (episode) update(episode)
  }
}
