import { expose } from 'comlink'
import { query, mutate } from 'api/calls'
import IDBInterface from './store/idbInterface'
import bufferInstance from 'utils/instantiationBuffer'
import dbProm from './store/idb'
import store from './store'
import { deleteDB } from 'idb'
import { threaded, player } from 'store'
import { registerUICall } from './ui'
import { actions as accountActions } from './account'
import { pullSubscriptions } from './sync'
import { methods } from 'utils/proto'
import { prefix } from 'utils/object'

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

const api = {
  ...query,
  ...mutate,
  ...idbInterface,
  ...store,
  ...accountActions,
  ...threaded,
  ...prefix(methods(player), 'player', 'camel'),
  pullSubscriptions,
  deleteIDB,
  registerUICall,
} as const

export type API = typeof api

expose(api)
