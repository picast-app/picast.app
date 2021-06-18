import StoreX from './storeX'
import Settings from './settings'
import podcasts from './podcasts'
import library from './library'
import Account from 'main/account/state'
import { proxy } from 'comlink'
import type { State, FlatState } from './state'

export type Store = StoreX<State>

export const store = new StoreX<State>()

export const threaded = {
  listenX: <T extends keyof FlatState>(
    key: T,
    cb: (v: any, path: string) => any,
    ...subs: string[]
  ) => proxy(store.listen(key, cb, ...subs)),
  setX: proxy(store.set.bind(store)),
  mergeX: proxy(store.merge.bind(store)),
  getX: proxy(store.get.bind(store)),
}

export const settings = new Settings(store)
settings.construct()

export const user = new Account(store)
user.construct()

podcasts(store)
library(store)
