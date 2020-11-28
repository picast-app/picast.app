interface EchoDB extends import('idb').DBSchema {
  meta: {
    key: 'updateStatus'
    value: 'UP_TO_DATE' | 'EVICT_PENDING'
  }
  subscriptions: {
    key: string
    value: {
      id: string
      title: string
      author: string | null
      artwork: string | null
      description: string | null
      subscriptionTime?: Date
    }
  }
  episodes: {
    key: string
    value: {
      id: string
      podcast: string
      title: string
      file: string
      date: number
    }
  }
}
