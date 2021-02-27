import { observable, autorun } from 'mobx'
import dbProm from './store/idb'
import store from './store'
import { Podcast } from './store/types'

type State = {
  subscriptions: string[]
  user: {
    provider?: 'google'
    wsAuth?: string
  }
  signedIn: boolean
  signOut(): void
  signIn(v: { provider: 'google' }): void
  playing: {
    id?: EpisodeId
    episode: EpisodeMin | null
    podcast: Podcast | null
    set(v: { podcast: Podcast; episode: EpisodeMin } | null): void
  }
}

async function init(): Promise<{
  state: State
  subscribe: <T = unknown>(path: string, handler: (v: T) => void) => () => void
}> {
  const state = observable<State>({
    subscriptions: [],
    user: {},
    get signedIn() {
      return this.user.provider !== undefined
    },
    signOut() {
      this.user.provider = undefined
    },
    signIn(data) {
      Object.assign(this.user, data)
    },
    playing: {
      episode: null,
      podcast: null,
      set(v) {
        if (!v) {
          this.id = undefined
          this.podcast = null
          this.episode = null
        } else {
          this.id = [v.podcast.id, v.episode.id]
          this.podcast = v.podcast
          this.episode = v.episode
        }
      },
    },
  })

  const db = await dbProm
  const signin = await db.get('meta', 'signin')
  if (signin) state.signIn(signin)
  state.subscriptions = await db.getAllKeys('subscriptions')

  const playing = await db.get('meta', 'playing')
  if (playing) {
    state.playing.id = playing
    state.playing.podcast = await store.podcast(playing[0])
    state.playing.episode = await store.episode(playing)
  }

  const resolvePath = <T = unknown>(
    path: string,
    node: any = state
  ): T | undefined => {
    const [prop, ...rest] = path.split('.')
    if (!rest.length) return node[prop]
    return resolvePath(rest.join('.'), node[prop])
  }
  const unknown = Symbol('unknown')

  return {
    state,
    subscribe(path, handler) {
      let last: string | undefined | typeof unknown = unknown
      return autorun(() => {
        const value = resolvePath(path)
        const str: string = JSON.stringify(value) as any
        if (str !== last) {
          last = str
          handler(JSON.parse(str))
        }
      })
    },
  }
}
const appState = init()
export default appState

async function initSync() {
  if (!('BroadcastChannel' in globalThis)) return

  const channel = new BroadcastChannel('appstate')

  channel.onmessage = async ({ data }) => {
    const { state } = await appState
    logger.info('received broadcast update')
    await store.refresh()
    cancel?.()
    Object.assign(state, JSON.parse(data))
    listen()
  }

  const { state } = await appState

  const listen = () => {
    let updated = false
    cancel = autorun(() => {
      const current = JSON.stringify(state)
      const initial = !updated
      updated = true
      if (initial) return
      logger.info('broadcast update')
      channel.postMessage(current)
    })
  }
  let cancel: (() => void) | undefined = undefined
  listen()
}

initSync()
