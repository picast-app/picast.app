import * as api from 'main/api'
import type * as T from 'types/gql'
import { user } from './state'

export const signIn = async (creds: SignInCreds, wpSub?: string | null) => {
  const me = await api.signInGoogle(creds.accessToken, wpSub ?? undefined)
  await user.signIn(me)
}

export async function signInPassword(ident: string, password: string) {
  const res = await api.signInPassword(ident, password)
  if (res.user) await user.signIn(res.user)
  return res
}

export async function signUpPassword(ident: string, password: string) {
  const res = await api.signUpPassword(ident, password)
  if (res.user) await user.signIn(res.user)
  return res
}

export async function signOut() {
  user.signOut()
  await api.signOut()
}

export async function pullSubscriptions(
  subs?: T.Me_me_subscriptions
): Promise<{ added: string[]; removed: string[] }> {
  return { added: [], removed: [] }
}

export async function enablePushNotifications(id: string) {}

export async function disablePushNotifications(id: string) {}
