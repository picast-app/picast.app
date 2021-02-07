import * as api from './api'
import store from './store'
import dbProm from './store/idb'
import stateProm from './appState'
import * as sync from './sync'
import type * as T from 'types/gql'

export async function signIn(creds: SignInCreds) {
  const me = await api.signInGoogle(creds.accessToken)
  storeSignIn(me)
  await pullSubscriptions(me.subscriptions)
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
    if (!me) return logger.info('no logged in')
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
  }
}

pullSubscriptions()
