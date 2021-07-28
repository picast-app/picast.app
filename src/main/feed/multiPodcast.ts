import { Base, CB } from './base'
import type { Podcast as PodStore, EpisodeStore } from 'app/main/episodeStore'
import { store as storeX } from 'app/store'

export class MultiPodcast extends Base {
  private episodes: EpisodeKey[] = []
  private storeInfo = new Map<PodStore, MultiStoreInfo>(
    this.stores.map(store => [store, { lastIndex: -1, store }])
  )

  constructor(private readonly stores: PodStore[]) {
    super()

    for (const store of stores) {
      if (!store.isSubscribed)
        throw Error('all podcasts in MultiPodcast feed must be subscribed to')

      store.onEpisode = (...indices) => {
        const slots: [number, number][] = indices.map(i => [
          this.searchIndex(Base.numeric(store.read(i))),
          i,
        ])

        this.reattach(this.merge(store, ...slots))

        // todo: work out correct [lastIndex] advance
      }
    }
  }

  public static async create(
    store: EpisodeStore,
    podcasts: string[]
  ): Promise<MultiPodcast> {
    return new MultiPodcast(
      await Promise.all(podcasts.map(id => store.getPodcast(id)))
    )
  }

  async onSub(i: number, update: CB) {
    if (!this.indexMap[i]) return
    const episode = await storeX.get('episodes.*', this.indexMap[i][0])
    if (episode) update(episode)
  }

  onEstablishedSub(i: number) {
    while (i >= this.episodes.length) {
      let candidate: MultiStoreInfo | null = null

      for (const store of this.stores) {
        const info = this.storeInfo.get(store)!
        if (info.exhausted) continue
        if (!info.last) {
          const key = store.read(++info.lastIndex)
          if (key) info.last = MultiPodcast.parseKey(store.id, key)
        }
        if (!info.last) info.exhausted = true
        else if (!candidate?.last?.[0] || info.last[0] > candidate?.last?.[0])
          candidate = info
      }
      if (!candidate) break
      this.episodes.push(candidate.last!)
      delete candidate.last
    }

    if (!this.episodes[i]) return
    this.setKey(i, this.episodes[i][2])
    this.key(this.episodes[i][2]).i = i
    this.listen(this.episodes[i][2])
  }

  static parseKey = (podcast: string, id: string): EpisodeKey => [
    parseInt(id.slice(0, 6), 36),
    podcast,
    id,
  ]
}

type MultiStoreInfo = {
  last?: EpisodeKey
  lastIndex: number
  exhausted?: boolean
  store: PodStore
}

type EpisodeKey = [ts: number, ...id: EpisodeId]
