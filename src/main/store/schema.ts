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
      author?: string
      artwork?: string
      covers: string[]
      description?: string
      subscriptionDate?: Date
      check?: string
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
    indexes: { published: string; podcast: string }
  }
}
