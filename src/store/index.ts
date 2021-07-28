import StoreX, { Setter } from 'app/store/core/storeX'
import type { State, FlatState } from './state'
import Settings from 'app/store/handlers/settings'
import Account from 'app/store/handlers/user'
import podcasts from 'app/store/handlers/podcasts'
import library from 'app/store/handlers/library'
import Player from 'app/store/handlers/player'
import episodes from 'app/store/handlers/episodes'
import shownotes from 'app/store/handlers/shownotes'
import { proxy } from 'app/fiber'
import { omit } from 'app/utils/object'

export type Store = StoreX<State>
export const store = new StoreX<State>()
export type { State }

export const threaded = {
  listenX: <T extends keyof FlatState>(key: T, cb: Setter, ...subs: string[]) =>
    proxy(
      store.listen(
        key,
        (
          v: any,
          path: string,
          meta: Parameters<Setter>[2],
          ...subs: string[]
        ) => cb(v, path, omit(meta, 'noChange'), ...subs),
        ...subs
      )
    ),
  setX: store.set.bind(store),
  mergeX: store.merge.bind(store),
  getX: store.get.bind(store),
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
