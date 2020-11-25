import { expose } from 'comlink'
import * as apiCalls from './api'
import { ChannelManager } from 'utils/msgChannel'
import dbProm from './store'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare let self: DedicatedWorkerGlobalScope
export default null

const channels = new ChannelManager('main')

const api: MainAPI = apiCalls
expose(api)

self.addEventListener('message', async ({ data }) => {
  if (typeof data !== 'object') return
  const msg: WorkerMsg = data
  if (typeof data?.type !== 'string') return

  switch (msg.type) {
    case 'ADD_MSG_CHANNEL':
      {
        const { target, port } = (msg as WorkerMsg<'ADD_MSG_CHANNEL'>).payload
        channels.addChannel(target as Exclude<WorkerName, 'main'>, port)
      }
      break
  }
})

channels.onMessage = async (msg, source, respond) => {
  switch (msg.type) {
    case 'DB_READ': {
      const db = await dbProm
      const { table, key } = (msg as WorkerMsg<'DB_READ'>).payload
      respond('DB_DATA', await db.get(table, key))
      break
    }
    case 'DB_WRITE': {
      const db = await dbProm
      const { table, key, data } = (msg as WorkerMsg<'DB_WRITE'>).payload
      await db.put(table, data, key)
      break
    }
  }
}
