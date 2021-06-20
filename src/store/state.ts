import type { Flatten } from './types'

export type State = {
  settings: {
    appearance: {
      colorTheme: 'light' | 'dark'
      useSystemTheme: boolean
      extractColor: boolean
    }
    debug: {
      printLogs: boolean
      showTouchPaths: boolean
      playbackLoading: boolean
    }
  }
  user: {
    id: string
    subscriptions: string[]
    wpSubs: string[]
    wsAuth?: string
  } | null
  podcasts: {
    '*': Podcast | null
  }
  library: {
    sorting: string
    list: Podcast[]
  }
  player: {
    current: string
    queue: string[]
  }
}

export type FlatState = Flatten<State>
export type Key = keyof FlatState
export type Value<T extends Key> = FlatState[T]

export type Podcast = {
  id: string
  subscribed?: boolean
  title: string
  author?: string
  artwork?: string
  covers: string[]
  description?: string
  subscriptionDate?: number
  episodeCount?: number
  palette?: {
    vibrant: string
    lightVibrant: string
    darkVibrant: string
    muted: string
    lightMuted: string
    darkMuted: string
  }
  // sync
  check?: string
  lastMetaCheck?: number
  lastEpisodeCheck?: number
}

// type Episode = {
//   podcast: Podcast
//   id: string
//   title: string
//   file: string
// }
