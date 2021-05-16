import * as api from './api'
import store from './store'
import dbProm from './store/idb'
import stateProm from './appState'
import * as sync from './sync'
import { wsApi } from './ws'
import { setPlaying } from './playback'
import type * as T from 'types/gql'

export async function signIn(creds: SignInCreds, wpSub?: string | null) {
  const me = await api.signInGoogle(creds.accessToken, wpSub ?? undefined)
  await afterSignedIn(me)
}

export async function signInPassword(ident: string, password: string) {
  const res = await api.signInPassword(ident, password)
  if (res.user) await afterSignedIn(res.user)
  return res
}

export async function signUpPassword(ident: string, password: string) {
  const res = await api.signUpPassword(ident, password)
  if (res.user) await afterSignedIn(res.user)
  return res
}

async function afterSignedIn(user: any) {
  const { state } = await stateProm
  await storeSignIn(user, true)
  await state.setWPSubs(user.wpSubs)
  await pullSubscriptions(user.subscriptions)
}

export async function signOut(skipAPI = false) {
  logger.info('sign out', { skipAPI })

  const { state } = await stateProm
  state.user.provider = undefined
  state.user.signedIn = false
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

  if (!skipAPI) await api.signOut()
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
    if (!me) return
    await state.setWPSubs(me.wpSubs)
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
  if (!me) await signOut(true)
  else {
    const info = { signedIn: true }
    await db.put('meta', info, 'signin')
    state.signIn(info)
    await sync.meta(!action)
    if (!me.wsAuth) return
    state.user.wsAuth = me.wsAuth
    await wsApi.notify('identify', me.wsAuth)
    if (!me.currentEpisode?.id) return
    const {
      id: { podcast, episode },
      position,
    } = me.currentEpisode
    await setPlaying([podcast, episode], true, position)
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

stateProm.then(({ state }) => {
  if (state.user.signedIn) pullSubscriptions()
})
