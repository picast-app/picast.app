import { expose, proxy } from 'comlink'
import { togglePrint } from 'utils/logger'
import { query, mutate } from 'api/calls'
import IDBInterface from './store/idbInterface'
import bufferInstance from 'utils/instantiationBuffer'
import dbProm from './store/idb'
import store from './store'
import appState from './appState'
import { deleteDB } from 'idb'
import * as playback from './playback'
import { threaded } from 'store'
import { registerUICall } from './ui'
import { actions as accountActions } from './account'
import { pullSubscriptions } from './sync'

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

const state = async <T = unknown>(p: string, f: (v: T) => void) => {
  const { subscribe } = await appState
  return proxy(subscribe(p, f))
}

appState.then(({ subscribe }) => {
  subscribe('debug.print_logs', togglePrint)
})

const readState = async <T = any>(path: string): Promise<T> => {
  return await new Promise<T>(res => {
    const sp = state<T>(path, state => {
      res(state)
      sp.then(unsub => unsub())
    })
  })
}

const api = {
  ...query,
  ...mutate,
  ...idbInterface,
  ...store,
  ...playback,
  ...accountActions,
  ...threaded,
  pullSubscriptions,
  state,
  readState,
  deleteIDB,
  registerUICall,
} as const

export type API = typeof api

expose(api)
