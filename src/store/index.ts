import StoreX, { FlatSchema } from './storeX'
import Settings from './settings'
import { proxy } from 'comlink'

export type Schema = {
  settings: {
    appearance: {
      colorTheme: 'light' | 'dark'
      useSystemTheme: boolean
    }
    debug: {
      printLogs: boolean
      showTouchPaths: boolean
      playbackLoading: boolean
    }
  }
}
type Flat = FlatSchema<Schema>
export type Key = keyof Flat
export type Value<T extends Key> = Flat[T]
export type Store = StoreX<Schema>

export const store = new StoreX<Schema>()

export const threaded = {
  async listenX<T extends keyof Flat>(
    key: T,
    cb: (v: any, path: string) => any
  ) {
    cb(await store.get(key), key)
    return proxy(store.handler(key).set(cb))
  },
  setX: proxy(store.set.bind(store)),
  mergeX: proxy(store.merge.bind(store)),
}

export const settings = new Settings(store)
settings.construct()
