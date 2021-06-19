import { mutate } from 'api/calls'
import type * as T from 'types/gql'
import { store, user } from 'store'

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

export async function enablePushNotifications(id: string) {}

export async function disablePushNotifications(id: string) {}

export async function subscribe(id: string): Promise<boolean> {
  const user = await store.get('user')
  if (!user) return false
  store.set(
    'user.subscriptions',
    Array.from(new Set([...user.subscriptions, id]))
  )
  await mutate.subscribe(id)
  return true
}

export async function unsubscribe(id: string): Promise<boolean> {
  const user = await store.get('user')
  if (!user) return false
  store.set(
    'user.subscriptions',
    user.subscriptions.filter(v => v !== id)
  )
  await mutate.unsubscribe(id)
  return true
}
