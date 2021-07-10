import Service from './base'
import store from 'store/uiThread/api'
import { main } from 'workers'
import { proxy, release } from 'fiber'
import { callAll } from 'utils/function'

export default class StateListener extends Service {
  enable() {
    this.cancellers.push(
      store.listenX('player.current', id => {
        this.player.visible = !!id
        this.player.onEpisodeChange(id)
      }),
      store.listenX('player.status', this.player.onPlayStateChange)
    )

    // const cb = proxy(this.player.onJump)
    // main.playerOnJump(cb)
    // this.cancellers.push(() => main.playerUnsubJump(cb), cb[release])
  }

  disable() {
    callAll(this.cancellers)
    this.cancellers = []
  }

  private cancellers: ((() => void) | undefined)[] = []
}
