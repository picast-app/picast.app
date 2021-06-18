import type * as GQL from 'types/gql'
import idb from 'main/store/idb'
import { State } from 'store/state'
import MemCache, { OptPrim, _, HookDict, FBDict } from 'store/memCache'
import * as api from 'api/calls'
import { idbDefaultReader, idbWriter } from 'store/util'

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
    const remote = await api.query.me((state as any)?.subscriptions)
    logger.info({ remote })
  }
}
