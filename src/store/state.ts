import type { Flatten } from 'store/core/types'

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
  episodes: {
    '*': {
      '*': Episode | null
    }
  }
  library: {
    sorting: string
    list: Podcast[]
    totalEpisodeCount: number
  }
  player: {
    current: string
    status: 'playing' | 'paused' | 'waiting'
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

export type Episode = {
  id: string
  podcast: string
  title: string
  file: string
  published: number
  duration: number
  shownotes?: string
  currentTime?: number
  relProg?: number
  completed?: boolean
}
