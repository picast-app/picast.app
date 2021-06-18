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
    wsAuth?: string
  } | null
  podcasts: {
    '*': Podcast | null
  }
  library: {
    sorting: string
    list: Podcast[]
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
