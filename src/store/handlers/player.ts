import MemCache, { OptPrim, _, HookDict } from 'store/utils/memCache'
import type { State } from 'store/state'
import { idbDefaultReader, idbWriter } from 'store/utils/idb'
import makePlayState from 'audio/state'

export default class Player extends MemCache<State['player']> {
  root = 'player'
  private status = makePlayState()

  state: OptPrim<State['player']> = {
    current: _,
    queue: [],
    status: this.status.current,
  }

  hooks: HookDict<State['player']> = {
    status: v => this.status.transition(v),
    current: idbWriter('playerCurrent'),
  }

  async init() {
    const idb = await idbDefaultReader(['playerCurrent', 'playerQueue'], {
      playerQueue: [],
    })

    this.state.current = idb.playerCurrent ?? null
    this.state.queue = idb.playerQueue
  }
}
