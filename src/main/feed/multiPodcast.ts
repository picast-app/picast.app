import { Base, UpdateCB } from './base'
import { asyncQueue } from 'utils/decorators'
import type { EpisodeBase } from 'main/store/types'
import type {
  Podcast as PodStore,
  default as EpisodeStore,
} from 'main/store/episodeStore'

export class MultiPodcast extends Base {
  private episodes: EpisodeBase[] = []
  private storeInfo = new Map<PodStore, MultiStoreInfo>(
    this.stores.map(store => [store, { lastIndex: -1, store }])
  )

  constructor(private readonly stores: PodStore[]) {
    super()

    for (const store of stores) {
      if (!store.isSubscribed)
        throw Error('all podcasts in MultiPodcast feed must be subscribed to')

      store.onEpisode = (...indices) => {
        logger.info('store has', ...indices)
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

  @asyncQueue
  async onSub(i: number, update: UpdateCB) {
    while (i >= this.episodes.length) {
      let candidate: MultiStoreInfo | null = null
      for (const store of this.stores) {
        const info = this.storeInfo.get(store)!
        if (info.exhausted) continue
        const last = (info.last ??= await store.read(++info.lastIndex))
        if (!last) {
          info.exhausted = true
          continue
        }
        if (last.published > (candidate?.last?.published ?? -Infinity))
          candidate = info
      }
      if (!candidate) break
      this.episodes.push(candidate.last!)
      delete candidate.last
    }
    update(this.episodes[i])
  }
}
type MultiStoreInfo = {
  last?: EpisodeBase
  lastIndex: number
  exhausted?: boolean
  store: PodStore
}
