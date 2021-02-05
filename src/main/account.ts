import * as api from './api'
import store from './store'
import type * as T from 'types/gql'

export async function signIn(creds: SignInCreds) {
  const { subscriptions } = await api.signInGoogle(creds.accessToken)
  await pullSubscriptions(subscriptions)
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
    if (!me) return logger.info('no logged in')
    subs = me.subscriptions
  }
  return await store.syncSubscriptions({
    add: subs.added,
    remove: subs.removed,
  })
}

pullSubscriptions()
