import type { Podcast as _Podcast, Episode } from 'store/state'

type Podcast = Omit<_Podcast, 'subscribed'>

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
    value: Podcast
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
