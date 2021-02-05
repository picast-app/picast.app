import { expose } from 'comlink'
import { togglePrint } from 'utils/logger'
import * as apiCalls from './api'
import IDBInterface from './store/idbInterface'
import bufferInstance from 'utils/instantiationBuffer'
import dbProm from './store/idb'
import store from './store'
import * as account from './account'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const self: DedicatedWorkerGlobalScope
export default null

const idbInterface = bufferInstance(IDBInterface, IDBInterface.create())

dbProm.then(async idb => togglePrint(await idb.get('meta', 'print_logs')))

const api = {
  ...apiCalls,
  ...idbInterface,
  ...store,
  ...account,
} as const

export type API = typeof api

expose(api)
