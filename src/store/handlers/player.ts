import MemCache, { OptPrim, _, HookDict } from 'store/utils/memCache'
import type { State } from 'store/state'
import { idbDefaultReader, idbWriter } from 'store/utils/idb'
import { Proxied, key } from 'fiber/wellKnown'
import makePlayState from 'utils/audioState'
import equals from 'utils/equal'
import { last } from 'utils/array'
import { callAll } from 'utils/function'

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

  public toggleEpisode(id: EpisodeId) {
    if (!equals(this.state.current, id)) return this.playEpisode(id)
    if (this.status.current === 'paused') this.resume()
    else this.pause()
  }

  public jump(seconds: number, relative = false) {
    callAll(Object.values(this.jumpListeners), seconds)
  }

  public onJump(cb: Proxied<λ<[time: number]>>) {
    this.jumpListeners[last(cb[key])] ??= cb
  }

  public unsubJump(cb: Proxied<λ<[time: number]>>) {
    delete this.jumpListeners[last(cb[key])]
  }

  private jumpListeners: Record<number, λ<[number]>> = {}
}
