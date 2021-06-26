import StoreX from 'store/core/storeX'
import Settings from 'store/handlers/settings'
import Account from 'store/handlers/user'
import podcasts from 'store/handlers/podcasts'
import library from 'store/handlers/library'
import Player from 'store/handlers/player'
import episodes from 'store/handlers/episodes'
import shownotes from 'store/handlers/shownotes'
import { proxy } from 'comlink'
import type { State, FlatState } from './state'

export type Store = StoreX<State>
export const store = new StoreX<State>()
export type { State }

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
episodes(store)
shownotes(store)
library(store)

export const player = new Player(store)
player.construct()
