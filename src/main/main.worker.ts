import 'app/polyfills'
import 'app/utils/logger'
import { expose } from 'app/fiber'
import { query, mutate } from 'app/api/calls'
import IDBInterface from './idb/idbInterface'
import dbProm from './idb/idb'
import bufferInstance from 'app/utils/instantiationBuffer'
import { deleteDB } from 'idb'
import { threaded } from 'app/store'
import { registerUICall } from './ui'
import { actions as accountActions } from './account'
import { pullSubscriptions } from './sync'
import { prefix } from 'app/utils/object'
import { VirtualPlayer } from 'app/audio/virtualPlayer'
import serialWrapper from 'app/audio/serialInterface'
import audioSync from 'app/audio/sync'
import * as feed from 'app/main/feed'

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
  ...accountActions,
  ...threaded,
  pullSubscriptions,
  deleteIDB,
  registerUICall,
  ...prefix(serialWrapper(audioSync(new VirtualPlayer())), 'player$'),
  ...feed,
} as const

export type API = typeof api

expose(api)
