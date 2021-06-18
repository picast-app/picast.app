import type { Podcast as _Podcast } from 'store/state'

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
}
export default IDBSchema

type Episode = {
  id: string
  podcast: string
  title: string
  file: string
  published: number
  duration: number
  currentTime?: number
  relProg?: number
  completed?: boolean
  shownotes: string
}
