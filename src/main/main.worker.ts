import { expose } from 'comlink'
import * as apiCalls from './api'
import { ChannelManager } from 'utils/msgChannel'
import { dbProm, Store } from './store'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare let self: DedicatedWorkerGlobalScope
export default null

const channels = new ChannelManager('main')
Store.channels = channels

const api: MainAPI = {
  ...apiCalls,
  podcast: Store.podcast,
  episode: Store.episode,
  subscribe: Store.subscribe,
  unsubscribe: Store.unsubscribe,
  subscriptions: Store.subscriptions,
  playing: Store.playing as any,
  setPlaying: Store.setPlaying,
  progress: Store.progress as any,
  setProgress: Store.setProgress,
  signIn,
}
expose(api)

async function signIn(v: SignInCreds) {
  await apiCalls.signInGoogle(v.accessToken)
}

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
      const { table, key } = (msg as WorkerMsg<'DB_READ'>).payload
      respond('DB_DATA', await (await dbProm).get(table, key))
      break
    }
    case 'DB_WRITE': {
      const { table, key, data } = (msg as WorkerMsg<'DB_WRITE'>).payload
      await (await dbProm).put(table, data, key)
      break
    }
    case 'ADD_FEED_SUB':
      respond('CONFIRM_FEED_SUB', {
        subId: Store.addFeedSub(
          (msg as WorkerMsg<'ADD_FEED_SUB'>).payload,
          source
        ),
      })
      break
    case 'CANCEL_FEED_SUB':
      Store.cancelFeedSub((msg as WorkerMsg<'CANCEL_FEED_SUB'>).payload.subId)
      break
  }
}
