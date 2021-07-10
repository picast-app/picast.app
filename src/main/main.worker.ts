import 'polyfills'
import 'utils/logger'
import { expose } from 'fiber'
import { query, mutate } from 'api/calls'
import IDBInterface from './store/idbInterface'
import bufferInstance from 'utils/instantiationBuffer'
import dbProm from './store/idb'
import store from './store'
import { deleteDB } from 'idb'
import { threaded } from 'store'
import { registerUICall } from './ui'
import { actions as accountActions } from './account'
import { pullSubscriptions } from './sync'
import { prefix } from 'utils/object'
import { VirtualPlayer, serialWrapper } from 'audio/virtualPlayer'

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
  pullSubscriptions,
  deleteIDB,
  registerUICall,
  ...prefix(serialWrapper(new VirtualPlayer()), 'player$'),
} as const

export type API = typeof api

expose(api)
