import MemCache, { OptPrim, _, HookDict } from 'store/utils/memCache'
import type { State } from 'store/state'
import { idbDefaultReader, idbWriter } from 'store/utils/idb'
import makePlayState from 'audio/state'
import { debounce } from 'utils/function'

export default class Player extends MemCache<State['player']> {
  root = 'player'
  private status = makePlayState()

  state: OptPrim<State['player']> = {
    current: _,
    queue: [],
    status: this.status.current,
    duration: undefined,
    volume: _,
    muted: _,
  }

  hooks: HookDict<State['player']> = {
    status: v => this.status.transition(v),
    current: idbWriter('playerCurrent'),
    muted: idbWriter('muted'),
    volume: debounce(idbWriter('volume'), 500),
  }

  async init() {
    const idb = await idbDefaultReader(
      ['playerCurrent', 'playerQueue', 'muted', 'volume'],
      {
        playerQueue: [],
      }
    )

    this.state.current = idb.playerCurrent ?? null
    this.state.queue = idb.playerQueue
    this.state.muted = idb.muted ?? false
    this.state.volume = idb.volume ?? 0.4
  }
}
