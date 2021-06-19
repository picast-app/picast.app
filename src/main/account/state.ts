import type * as GQL from 'types/gql'
import idb from 'main/store/idb'
import { State } from 'store/state'
import MemCache, { OptPrim, _, HookDict, FBDict } from 'store/memCache'
import * as api from 'api/calls'
import * as convert from 'api/convert'
import { idbDefaultReader, idbWriter } from 'store/util'
import equals from 'utils/equal'
import epStore from 'main/store/episodeStore'

export default class UserState extends MemCache<State['user']> {
  root = 'user'
  state: OptPrim<State['user']> = _
  sync = 'user'

  hooks: HookDict<State['user']> = {
    $: async state => {
      logger.info('state hook', state)
      await Promise.all([
        this.reattach(),
        state ? this.writeSignedIn(state) : this.writeSignedOut(),
      ])
    },
    subscriptions: idbWriter('subscriptions'),
  }

  fbs: FBDict<State['user']> = {
    subscriptions: () => [],
  }

  async init() {
    const state = await idbDefaultReader(['currentUser', 'subscriptions'])
    logger.info('user state:', state)

    if (!state.currentUser) this.state = null
    else
      this.state = {
        id: state.currentUser,
        subscriptions: state.subscriptions ?? [],
      }

    this.pullRemote()
  }

  public async signIn(data: GQL.MeInitial) {
    await this.initialized
    if (this.state) throw Error('already signed in')

    this.store.set('user', {
      id: data.id,
      subscriptions: data.subscriptions.added.map(({ id }) => id),
    })
  }

  public signOut() {
    this.store.set('user', null)
  }

  private async writeSignedIn(user: Exclude<State['user'], null>) {
    const db = await idb
    await db.put('meta', user.id, 'currentUser')
    await db.put('meta', user.subscriptions, 'subscriptions')
  }

  private async writeSignedOut() {
    const db = await idb
    await db.delete('meta', 'currentUser')
    await db.delete('meta', 'subscriptions')
  }

  private async pullRemote() {
    const state = await this.initialized
    if (!state) return

    let subs = [...state.subscriptions]
    const remote = await api.query.me(subs)

    subs = subs.filter(
      id => !(remote?.subscriptions.removed ?? []).includes(id)
    )

    for (const added of remote?.subscriptions.added ?? []) {
      this.store.set('podcasts.*', convert.podcast(added), {}, added.id)
      subs.push(added.id)

      if (!added.episodes?.edges.length) continue
      const store = await (await epStore).getPodcast(added.id)
      store.addEpisodes(
        added.episodes.edges.map(v => convert.episode(v.node, added.id))
      )
    }

    if (!equals(subs, state.subscriptions))
      this.store.set('user.subscriptions', subs)

    logger.info({ remote })
  }
}
