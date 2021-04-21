import { observable, autorun } from 'mobx'
import dbProm from './store/idb'
import store from './store'
import { Podcast } from './store/types'
import { titleSort } from './utils'

export type State = {
  subscriptions: Podcast[]
  addSubscription(...podcasts: Podcast[]): void
  removeSubscription(...ids: string[]): void
  wpSubs: string[]
  addWPSub(...ids: string[]): Promise<void>
  removeWPSub(...ids: string[]): Promise<void>
  setWPSubs(ids: string[]): Promise<void>
  user: {
    provider?: 'google'
    wsAuth?: string
  }
  signedIn: boolean
  signOut(): void
  signIn(v: { provider: 'google' }): void
  playing: {
    id: EpisodeId | null
    current: [Podcast | null, EpisodeMin | null]
    set(id: EpisodeId | null): Promise<EpisodeMin | undefined>
  }
  queue: EpisodeId[]
  debug: {
    touch: boolean
    print_logs: boolean
    set(update: Omit<Partial<State['debug']>, 'set'>): void
  }
}

async function init(): Promise<{
  state: State
  subscribe: <T = unknown>(path: string, handler: (v: T) => void) => () => void
}> {
  const db = await dbProm
  const playing = await db.get('meta', 'playing')

  const state = observable<State>({
    subscriptions: [],
    wpSubs: await store.wpSubscriptions(),
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
      id: playing ?? null,
      current: !playing
        ? [null, null]
        : await Promise.all([
            store.podcast(playing[0]),
            store.episode(playing),
          ]),
      async set(id) {
        if (!id) {
          this.id = null
          this.current = [null, null]
        } else {
          if (this.id?.[0] === id[0] && this.id?.[1] === id[1]) return
          const [podcast, episode] = await Promise.all([
            store.podcast(id[0]),
            store.episode(id as any),
          ])
          this.id = id
          this.current = [podcast, episode]
          return episode as EpisodeMin
        }
      },
    },
    queue: [],
    debug: {
      touch: !!(await db.get('meta', 'touch')),
      print_logs: (await db.get('meta', 'print_logs')) ?? false,
      async set(update) {
        for (const [k, v] of Object.entries(update)) {
          // @ts-ignore
          this[k] = v
          await db.put('meta', v, k)
        }
      },
    },

    addSubscription(...podcasts) {
      const newSubs = podcasts.filter(
        ({ id }) => !this.subscriptions.find(v => v.id === id)
      )
      this.subscriptions = titleSort([...this.subscriptions, ...newSubs])
    },
    removeSubscription(...ids) {
      this.subscriptions = this.subscriptions.filter(
        ({ id }) => !ids.includes(id)
      )
    },
    async addWPSub(...ids) {
      this.wpSubs = Array.from(new Set([...this.wpSubs, ...ids]))
      await store.addWpSub(...ids)
    },
    async removeWPSub(...ids) {
      this.wpSubs = this.wpSubs.filter(id => !ids.includes(id))
      await store.removeWpSubs(...ids)
    },
    async setWPSubs(ids) {
      const added = ids.filter(id => !this.wpSubs.includes(id))
      const removed = this.wpSubs.filter(id => !ids.includes(id))
      this.wpSubs = ids
      if (added.length) await store.addWpSub(...added)
      if (removed.length) await store.removeWpSubs(...removed)
    },
  })

  const signin = await db.get('meta', 'signin')
  if (signin) state.signIn(signin)
  const subs = await db.getAll('subscriptions')
  state.subscriptions = titleSort(subs)

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
