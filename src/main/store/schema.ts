import type { DBSchema } from 'idb'

export default interface Schema extends DBSchema {
  meta: {
    key: string
    value: any
  }
  subscriptions: {
    key: string
    value: {
      id: string
      title: string
      author: string | null
      artwork: string | null
      description: string | null
      subscriptionDate?: Date
      episodeCount?: number
    }
  }
  episodes: {
    key: string
    value: {
      id: string
      podcast: string
      title: string
      file: string
      published: number
    }
    indexes: { date: string; podcast: string }
  }
}
