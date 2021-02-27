import { expose, proxy } from 'comlink'
import { togglePrint } from 'utils/logger'
import * as apiCalls from './api'
import IDBInterface from './store/idbInterface'
import bufferInstance from 'utils/instantiationBuffer'
import dbProm from './store/idb'
import store from './store'
import * as account from './account'
import appState from './appState'
import { deleteDB } from 'idb'
import * as sync from './sync'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const self: DedicatedWorkerGlobalScope
export default null

const idbInterface = bufferInstance(IDBInterface, IDBInterface.create())

async function deleteIDB() {
  const db = await dbProm
  db.close()
  await deleteDB(self.location.hostname, {
    blocked() {
      logger.error('idb delete blocked')
    },
  })
}

dbProm.then(async idb => togglePrint(await idb.get('meta', 'print_logs')))

const state = async <T = unknown>(p: string, f: (v: T) => void) => {
  const { subscribe } = await appState
  return proxy(subscribe(p, f))
}

const api = {
  ...apiCalls,
  ...idbInterface,
  ...store,
  ...sync,
  ...account,
  state,
  deleteIDB,
} as const

export type API = typeof api

expose(api)
