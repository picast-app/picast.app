import { mutate } from 'api/calls'
import type * as T from 'types/gql'
import { user } from './state'

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

export async function pullSubscriptions(
  subs?: T.Me_me_subscriptions
): Promise<{ added: string[]; removed: string[] }> {
  return { added: [], removed: [] }
}

export async function enablePushNotifications(id: string) {}

export async function disablePushNotifications(id: string) {}
