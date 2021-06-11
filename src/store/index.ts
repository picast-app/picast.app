import StoreX from './storeX'
import Settings from './settings'
import { proxy } from 'comlink'
import type { State, FlatState } from './state'

export type Store = StoreX<State>

export const store = new StoreX<State>()

export const threaded = {
  async listenX<T extends keyof FlatState>(
    key: T,
    cb: (v: any, path: string) => any,
    ...subs: string[]
  ) {
    cb(await store.get(key, ...subs), key)
    return proxy(store.handler(key).set(cb))
  },
  setX: proxy(store.set.bind(store)),
  mergeX: proxy(store.merge.bind(store)),
  getX: proxy(store.get.bind(store)),
}

export const settings = new Settings(store)
settings.construct()
