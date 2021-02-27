import * as api from './api'
import store from './store'
import dbProm from './store/idb'
import stateProm from './appState'
import * as sync from './sync'
import { wsApi } from './ws'
import type * as T from 'types/gql'

export async function signIn(creds: SignInCreds) {
  const me = await api.signInGoogle(creds.accessToken)
  storeSignIn(me)
  await pullSubscriptions(me.subscriptions)
}

export async function signOut() {
  const { state } = await stateProm
  state.user.provider = undefined
  state.subscriptions = []

  const db = await dbProm
  await db.clear('subscriptions')
  await db.clear('episodes')
  await db.delete('meta', 'signin')

  const cacheKeys = await caches.keys()
  logger.info(cacheKeys)
  const cache = await caches.open(cacheKeys.find(k => /\.photo$/.test(k))!)
  const keys = await cache.keys()
  logger.info(`evict ${keys.length} images`)
  await Promise.all(keys.map(k => cache.delete(k)))

  await api.signOut()
}

export async function pullSubscriptions(
  subs?: T.Me_me_subscriptions
): Promise<
  | {
      added: string[]
      removed: string[]
    }
  | undefined
> {
  logger.info('pull subscriptions')
  if (!subs) {
    const subscriptions = await store.getSubscriptions()
    const me = await api.me(subscriptions)
    storeSignIn(me)
    if (!me) return logger.info('not logged in')
    subs = me.subscriptions
  }
  return await store.syncSubscriptions({
    add: subs.added,
    remove: subs.removed,
  })
}

async function storeSignIn(me: T.Me_me | null) {
  const db = await dbProm
  const { state } = await stateProm
  if (!me) {
    await db.delete('meta', 'signin')
    state.signOut()
  } else {
    const info = { provider: me.authProvider }
    await db.put('meta', info, 'signin')
    state.signIn(info)
    await sync.meta()
    if (!me.wsAuth) return
    state.user.wsAuth = me.wsAuth
    await wsApi.notify('identify', me.wsAuth)
    if (!me.currentEpisode?.id) return
    const { podcast, episode } = me.currentEpisode.id
    state.playing.set([podcast, episode])
  }
}

pullSubscriptions()
