import Service from './base'
import store from 'store/uiThread/api'
import { main } from 'workers'
import { proxy, release } from '@picast-app/fiber'
import { callAll } from 'utils/function'
import { asyncCB } from 'utils/promise'
import { MsgOut } from 'audio/serialInterface'

export default class StateListener extends Service {
  enable() {
    this.cancellers.push(
      store.listenX('player.current', id => {
        this.player.visible = !!id
        this.player.onEpisodeChange(id)
      }),
      store.listenX('player.status', this.player.onPlayStateChange),
      store.listenX('player.duration', this.player.onDurationChange)
    )

    const _proxy = <T extends λ>(f: T) => {
      const prox = proxy(f)
      this.cancellers.push(prox[release]!)
      return prox
    }

    const handlerPlayerMsg = (msg: MsgOut) => {
      if (
        msg.type === 'JUMP' &&
        msg.src === this.player.audioAdapter.audio?.src
      )
        this.player.onJump(msg.seconds)
    }

    this.cancellers.push(asyncCB(main.player$listen(_proxy(handlerPlayerMsg))))
  }

  disable() {
    callAll(this.cancellers)
    this.cancellers = []
  }

  private cancellers: (() => void)[] = []
}
