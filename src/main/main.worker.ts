import { expose } from 'comlink'
import 'utils/logger'
import * as apiCalls from './api'
import Store from './store'
import bufferInstance from 'utils/instantiationBuffer'
import IDBInterface from './store/idbInterface'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const self: DedicatedWorkerGlobalScope
export default null

async function fetchMe(subs: string[]) {
  const me = await apiCalls.me(subs)
  if (!me) return

  const remove = me.subscriptions.removed.filter(id => subs.includes(id))
  await Promise.all(remove.map(id => store.removeSubscription(id, true)))

  const add = me.subscriptions.added.filter(({ id }) => !subs.includes(id))
  await Promise.all(add.map(({ id }) => store.addSubscription(id, true)))
}

const _store = Store.create().then(store => {
  fetchMe(store.getSubscriptions())
  return store
})

const store = bufferInstance(Store, _store)
const idbInterface = bufferInstance(IDBInterface, IDBInterface.create())

const api = {
  ...apiCalls,
  ...idbInterface,
  ...store,
  signIn,
} as const

export type API = typeof api

expose(api)

async function signIn(creds: SignInCreds) {
  await apiCalls.signInGoogle(creds.accessToken)
  await fetchMe(await store.getSubscriptions())
}
