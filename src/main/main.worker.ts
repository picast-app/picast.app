import 'polyfills'
import 'utils/logger'
import { expose } from '@picast-app/fiber'
import { query, mutate } from 'api/calls'
import IDBInterface from './idb/idbInterface'
import dbProm from './idb/idb'
import bufferInstance from 'utils/instantiationBuffer'
import { deleteDB } from 'idb'
import { threaded } from 'store'
import { registerUICall } from './ui'
import { actions as accountActions } from './account'
import { pullSubscriptions } from './sync'
import { prefix } from 'utils/object'
import { VirtualPlayer } from 'audio/virtualPlayer'
import serialWrapper from 'audio/serialInterface'
import audioSync from 'audio/sync'
import * as feed from 'main/feed'

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

expose(api, self, process.env.NODE_ENV !== 'production')
