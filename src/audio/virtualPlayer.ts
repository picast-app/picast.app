import { Proxied, key } from 'fiber/wellKnown'
import EventEmitter from 'utils/event'
import equals from 'utils/equal'
import { last } from 'utils/array'
import { store } from 'store'
import { callAll } from 'utils/function'
import { bindThis } from 'utils/proto'

type Events = {
  play: λ<[id: EpisodeId, sec: number]>
  stop: λ<[]>
  playing: λ<[]>
  changeTrack: λ<[id: EpisodeId | null]>
}

export class VirtualPlayer extends EventEmitter<Events> {
  private track?: EpisodeId
  private position?: number
  private playStart?: number

  constructor() {
    super()
    bindThis(this)
  }

  public setTrack(id: EpisodeId) {
    if (equals(this.track, id)) return
    this.track = id
    this.call('changeTrack', id)
  }

  public setPosition(seconds: number) {
    // this.position = [seconds, time]
    this.position = seconds
  }

  public start() {
    if (!this.track) throw Error('no track selected')
    if (typeof this.position !== 'number')
      throw Error("can't start from unknown position")
    this.call('play', this.track, this.position)
  }

  public stop() {
    this.call('stop')
  }

  public isPlaying(secs: number) {
    console.log('IS PLAYING AT', secs)
    this.call('playing')
  }

  // public get isPlaying() {
  //   return 'playStart' in this
  // }
}

type MsgIn = { type: 'IS_PLAYING'; seconds: number }
type MsgOut =
  | { type: 'PLAY'; id: EpisodeId; seconds: number }
  | { type: 'PAUSE' }
  | { type: 'SELECT'; id: EpisodeId }

export function serialWrapper(player: VirtualPlayer) {
  const listeners: Record<number, λ<[MsgOut]>> = {}

  const emit = (msg: MsgOut) => {
    callAll(Object.values(listeners), msg)
  }

  player.addEventListener('play', (id, seconds) => {
    emit({ type: 'PLAY', id, seconds })
    store.set('player.status', 'waiting')
  })

  player.addEventListener('playing', () => {
    store.set('player.status', 'playing')
  })

  player.addEventListener('stop', () => {
    emit({ type: 'PAUSE' })
    store.set('player.status', 'paused')
  })

  player.addEventListener('changeTrack', id => {
    store.set('player.current', id)
    if (id) emit({ type: 'SELECT', id })
  })

  store.get('player.current').then(v => {
    if (!v) return
    player.setTrack(v)
    player.setPosition(0) //
  })

  function post(msg: MsgIn) {
    switch (msg.type) {
      case 'IS_PLAYING':
        player.isPlaying(msg.seconds)
        break
      default:
        logger.error('invalid message', msg)
    }
  }

  return {
    post,
    listen(listener: Proxied<λ<[msg: MsgOut]>>) {
      listeners[last(listener[key])] ??= listener
      return () => {
        delete listeners[last(listener[key])]
      }
    },
    start: player.start,
    stop: player.stop,
  }
}
