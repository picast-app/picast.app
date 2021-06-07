import type { FlatSchema } from './storeX'

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
}

export type FlatState = FlatSchema<State>
export type Key = keyof FlatState
export type Value<T extends Key> = FlatState[T]
