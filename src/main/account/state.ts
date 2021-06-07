import { store } from 'store'
import type * as GQL from 'types/gql'
import idb from 'main/store/idb'
import { State } from 'store/state'
import MemCache, { OptPrim, _, HookDict } from 'store/memCache'

class UserState extends MemCache<State['user']> {
  root = 'user'
  state: OptPrim<State['user']> = _

  hooks: HookDict<State['user']> = {
    $: async state => {
      await Promise.all([
        this.reattach(),
        state ? this.writeSignedIn(state) : this.writeSignedOut(),
      ])
    },
  }

  async init() {
    const db = await idb
    const id = await db.get('meta', 'currentUser')
    if (!id) this.state = null
    else this.state = { id }
  }

  public async signIn(data: GQL.MeInitial) {
    await this.initialized
    if (this.state) throw Error('already signed in')
    this.store.set('user', { id: data.id })
  }

  public signOut() {
    this.store.set('user', null)
  }

  private async writeSignedIn(user: Exclude<State['user'], null>) {
    const db = await idb
    await db.put('meta', user.id, 'currentUser')
  }

  private async writeSignedOut() {
    const db = await idb
    await db.delete('meta', 'currentUser')
  }
}

export const user = new UserState(store)
user.construct()
