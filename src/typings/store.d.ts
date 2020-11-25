interface EchoDB extends import('idb').DBSchema {
  meta: {
    key: 'updateStatus'
    value: 'UP_TO_DATE' | 'EVICT_PENDING'
  }
  podcasts: {
    key: string
    value: {
      title: string
      author: string
      artwork: string
    }
  }
  user: {
    key: string
    value: { subscriptions: string[] }
  }
}
