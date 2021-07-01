import MemCache, { OptPrim, _, HookDict } from 'store/utils/memCache'
import type { State } from 'store/state'
import { idbDefaultReader } from 'store/utils/idb'
import makePlayState from 'utils/audioState'

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
  }

  async init() {
    const idb = await idbDefaultReader(['playerCurrent', 'playerQueue'], {
      playerQueue: [],
    })

    this.state.current = idb.playerCurrent ?? null
    this.state.queue = idb.playerQueue
  }

  public playEpisode(episode: EpisodeId) {
    logger.info('play', episode)
    this.store.set('player.current', episode)
    this.store.set('player.status', 'waiting')
  }

  public resume() {
    if (!this.state.current) return
    this.store.set('player.status', 'waiting')
  }

  public pause() {
    if (!this.state.current) return
    this.store.set('player.status', 'paused')
  }
}
