import { expose } from 'comlink'
import 'utils/logger'
import * as apiCalls from './api'
import Store from './store'
import bufferInstance from 'utils/instantiationBuffer'
import IDBInterface from './store/idbInterface'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const self: DedicatedWorkerGlobalScope
export default null

const _store = Store.create().then(store => {
  store.syncSubscriptions()
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
  await store.syncSubscriptions()
}
