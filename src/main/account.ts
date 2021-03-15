import * as api from './api'
import store from './store'
import dbProm from './store/idb'
import stateProm from './appState'
import * as sync from './sync'
import { wsApi } from './ws'
import type * as T from 'types/gql'

export async function signIn(creds: SignInCreds, wpSub?: string | null) {
  const me = await api.signInGoogle(creds.accessToken, wpSub ?? undefined)
  const { state } = await stateProm
  storeSignIn(me, true)
  await state.setWPSubs(me.wpSubs)
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
  await db.delete('meta', 'wpSubs')

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
  const { state } = await stateProm
  if (!subs) {
    const subscriptions = await store.getSubscriptions()
    const me = await api.me(subscriptions)
    await storeSignIn(me)
    if (me) await state.setWPSubs(me.wpSubs)
    if (!me) return logger.info('not logged in')
    subs = me.subscriptions
  }
  return await store.syncSubscriptions({
    add: subs.added,
    remove: subs.removed,
  })
}

async function storeSignIn(me: T.Me_me | null, action = false) {
  logger.info('store sign in', me)
  const db = await dbProm
  const { state } = await stateProm
  if (!me) {
    await db.delete('meta', 'signin')
    state.signOut()
  } else {
    const info = { provider: me.authProvider }
    await db.put('meta', info, 'signin')
    state.signIn(info)
    await sync.meta(!action)
    if (!me.wsAuth) return
    state.user.wsAuth = me.wsAuth
    await wsApi.notify('identify', me.wsAuth)
    if (!me.currentEpisode?.id) return
    const { podcast, episode } = me.currentEpisode.id
    state.playing.set([podcast, episode])
  }
}

export async function enablePushNotifications(id: string) {
  logger.info('enable push notifications', id)
  const { state } = await stateProm
  state.addWPSub(id)
  await api.wpPodSub(id)
}

export async function disablePushNotifications(id: string) {
  logger.info('disable push notifications', id)
  const { state } = await stateProm
  state.removeWPSub(id)
  await api.wpPodUnsub(id)
}

pullSubscriptions()
