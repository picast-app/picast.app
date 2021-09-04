import StoreX, { Setter } from 'store/core/storeX'
import type { State, FlatState } from './state'
import Settings from 'store/handlers/settings'
import Account from 'store/handlers/user'
import podcasts from 'store/handlers/podcasts'
import library from 'store/handlers/library'
import Player from 'store/handlers/player'
import episodes from 'store/handlers/episodes'
import shownotes from 'store/handlers/shownotes'
import ep2Pod from 'store/handlers/episodePodMap'
import { proxy } from '@picast-app/fiber'
import { omit } from 'utils/object'

export type Store = StoreX<State>
export const store = new StoreX<State>()
export type { State }

export const threaded = {
  listenX: <T extends keyof FlatState>(key: T, cb: Setter, ...subs: string[]) =>
    proxy(
      store.listen(
        key,
        (v, path, meta, ...subs) =>
          cb(v, path, omit(meta, 'noChange'), ...subs),
        ...subs
      )
    ),
  listenJoinedX: <T extends keyof FlatState, K extends keyof FlatState>(
    on: T,
    key: K,
    cb: Setter
  ) =>
    proxy(
      store.listenJoined(on, key, (v, path, meta) =>
        cb(v, path, omit(meta, 'noChange'))
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

export const player = new Player(store)
player.construct()

podcasts(store)
episodes(store)
shownotes(store)
library(store)
ep2Pod(store)
