import MemCache, { OptPrim, _ } from 'store/memCache'
import type { State } from 'store/state'
import { idbDefaultReader } from 'store/util'

export default class Player extends MemCache<State['player']> {
  root = 'player'

  state: OptPrim<State['player']> = {
    current: _,
    queue: [],
    status: 'paused',
  }

  async init() {
    const idb = await idbDefaultReader(['playerCurrent', 'playerQueue'], {
      playerQueue: [],
    })

    this.state.current = idb.playerCurrent ?? null
    this.state.queue = idb.playerQueue
  }

  public async playEpisode(episode: EpisodeId) {
    logger.info('play', episode)
  }
}
