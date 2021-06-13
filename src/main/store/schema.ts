type IDBSchema = {
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
      lastMetaCheck?: number
      episodeCount?: number
      palette?: {
        vibrant: string
        lightVibrant: string
        darkVibrant: string
        muted: string
        lightMuted: string
        darkMuted: string
      }
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
      duration: number
      currentTime?: number
      relProg?: number
      completed?: boolean
      shownotes: string
    }
    indexes: { published: string; podcast: string }
  }
}
export default IDBSchema
