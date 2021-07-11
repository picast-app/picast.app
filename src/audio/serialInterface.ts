import { VirtualPlayer, Events } from './virtualPlayer'
import { Proxied, key } from 'fiber/wellKnown'
import { last } from 'utils/array'
import { store } from 'store'
import { callAll } from 'utils/function'
import { forEach } from 'utils/object'

export type MsgOut =
  | { type: 'PLAY'; src: string; seconds: number }
  | { type: 'PAUSE' }
  | { type: 'SELECT'; src: string }
  | { type: 'JUMP'; src: string; seconds: number }

export default function serialWrapper(player: VirtualPlayer) {
  const listeners: Record<number, λ<[MsgOut]>> = {}

  const emit = (msg: MsgOut) => {
    callAll(Object.values(listeners), msg)
  }

  const handlers: Partial<Events> = {
    play: (src, seconds) => {
      emit({ type: 'PLAY', src, seconds })
      store.set('player.status', 'waiting')
    },
    playing: () => {
      store.set('player.status', 'playing')
    },
    stop: () => {
      emit({ type: 'PAUSE' })
      store.set('player.status', 'paused')
    },
    changeTrack: (id, src) => {
      store.set('player.current', id)
      if (src) emit({ type: 'SELECT', src })
    },
    changeDuration: (secs, updated) => {
      store.set('player.duration', secs)
      // if (updated) // persist
    },
    jump: (seconds, src) => {
      emit({ type: 'JUMP', seconds, src })
    },
  }

  forEach(handlers, (k, v) => player.addEventListener(k, v as any))

  store.get('player.current').then(v => {
    if (!v) return
    player.setTrack(v)
    player.setPosition(0) //
  })

  return {
    listen(listener: Proxied<λ<[msg: MsgOut]>>) {
      listeners[last(listener[key])] ??= listener
      return () => {
        delete listeners[last(listener[key])]
      }
    },
    start: player.start,
    stop: player.stop,
    isPlaying: player.isPlaying,
    setDuration: player.setDuration,
    jump: player.setPosition,
  }
}
