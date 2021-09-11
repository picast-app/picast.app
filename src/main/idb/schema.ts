import type { Podcast as _Podcast, Episode } from 'store/state'
import { pick } from 'utils/object'

type Podcast = Omit<_Podcast, 'subscribed'>

export const podKeys = {
  required: ['id', 'feed', 'title'] as const,
  optional: [
    'author',
    'artwork',
    'covers',
    'description',
    'subscriptionDate',
    'episodeCount',
    'palette',
    'check',
    'lastMetaCheck',
    'lastEpisodeCheck',
  ] as const,
  get all() {
    return [...this.required, ...this.optional]
  },
}

export const dbPodcast = (podcast: _Podcast) => {
  const data = pick(podcast, ...podKeys.required, ...podKeys.optional)
  podKeys.required.forEach(key => {
    if (!data[key])
      throw Error(
        `podcast.${key} must be present in ${JSON.stringify(podcast)}`
      )
  })
  return data
}

export type DBPodcast = ReturnType<typeof dbPodcast>

type IDBSchema = {
  meta: {
    key: string
    value: any
  }
  subscriptions: {
    key: string
    value: Podcast
  }
  podcasts: {
    key: string
    value: DBPodcast
  }
  episodes: {
    key: string
    value: Episode
    indexes: { published: string; podcast: string }
  }
  episodeInfo: {
    key: string
    value: EpisodeInfo
  }
}
export default IDBSchema

type EpisodeInfo = {
  id: string
  shownotes?: string
  fetched: number
}
