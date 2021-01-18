import type { EpisodeBase } from './types'
import type { Podcast as PodStore } from './episodeStore'

type UpdateCB = (v: EpisodeBase) => void
type UnsubCB = () => void

export abstract class Base {
  constructor(public readonly id = ((Math.random() * 1e6) | 0).toString(36)) {}

  protected subs: UpdateCB[][] = []

  public addSub(index: number, update: UpdateCB): UnsubCB {
    ;(this.subs[index] ??= []).push(update)
    this.onSub(index, update)
    return () => {
      this.subs[index] = this.subs[index].filter(f => f !== update)
    }
  }

  abstract onSub(index: number, update: UpdateCB): void
}

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
