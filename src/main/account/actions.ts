import { mutate } from 'app/api/calls'
import { store, user } from 'app/store'
import * as set from 'app/utils/set'
import type { State } from 'app/store/state'

export const signIn = async (creds: SignInCreds, wpSub?: string | null) => {
  const me = await mutate.signInGoogle(creds.accessToken, wpSub ?? undefined)
  await user.signIn(me)
}

export async function signInPassword(ident: string, password: string) {
  const res = await mutate.signInPassword(ident, password)
  if (res.user) await user.signIn(res.user)
  return res
}

export async function signUpPassword(ident: string, password: string) {
  const res = await mutate.signUpPassword(ident, password)
  if (res.user) await user.signIn(res.user)
  return res
}

export async function signOut() {
  user.signOut()
  await mutate.signOut()
}

type User = Exclude<State['user'], null>

const signedInGuard =
  <T extends λ<[user: User, ...args: any[]], void | Promise<void>>>(f: T) =>
  async (
    ...args: Parameters<T> extends [any, ...infer TA] ? TA : never
  ): Promise<boolean> => {
    const user = await store.get('user')
    if (!user) return false
    await f(user, ...args)
    return true
  }

export const subscribe = signedInGuard(async (user, id: string) => {
  store.set('user.subscriptions', set.add(user.subscriptions, id))
  await mutate.subscribe(id)
})

export const unsubscribe = signedInGuard(async (user, id: string) => {
  store.set('user.subscriptions', set.remove(user.subscriptions, id))
  await mutate.unsubscribe(id)
})

export const enablePushNotifications = signedInGuard(
  async (user, id: string) => {
    store.set('user.wpSubs', set.add(user.wpSubs, id))
    await mutate.wpPodSub(id)
  }
)

export const disablePushNotifications = signedInGuard(
  async (user, id: string) => {
    store.set('user.wpSubs', set.remove(user.wpSubs, id))
    await mutate.wpPodUnsub(id)
  }
)
