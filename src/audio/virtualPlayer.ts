import EventEmitter from 'utils/event'
import equals from 'snatchblock/equal'
import { store } from 'store'
import { bindThis } from 'utils/proto'
import { clamp } from 'utils/math'

export type Events = {
  play: λ<[src: string, secs: number]>
  stop: λ<[]>
  finished: λ<[id: EpisodeId]>
  playing: λ<[]>
  waiting: λ<[]>
  changeTrack: λ<[id: EpisodeId | null, src: string | null]>
  changeDuration: λ<[secs: number]>
  jump: λ<[secs: number, src: string]>
  finalize: λ<[id: EpisodeId]>
}

export class VirtualPlayer extends EventEmitter<Events> {
  public track?: EpisodeId
  private src?: string
  private pos?: number
  private playStart?: number
  private waiting = false
  private rate = 1
  public duration?: number
  public initialStart?: number

  constructor() {
    super()
    bindThis(this)
  }

  get playing() {
    return typeof this.playStart === 'number'
  }

  public async setTrack(id: EpisodeId) {
    if (equals(this.track, id)) return
    if (this.src) await this.finalize()
    this.reset()

    this.track = id
    if (!id) return this.call('changeTrack', null, null)
    const file = await store.get('episodes.*.file', id[1])
    if (!file) throw Error(`can't find file for ${id[0]} ${id[1]}`)
    this.src = file
    this.setDuration(
      (await store.get('episodes.*.duration', id[1])) ?? 1200,
      file
    )
    this.call('changeTrack', id, file)
  }

  public async playTrack(id: EpisodeId) {
    await this.setTrack(id)
    this.start()
  }

  public async toggleTrack(id: EpisodeId) {
    if (!equals(this.track, id)) await this.playTrack(id)
    else if (this.playing || this.waiting) this.stop()
    else this.start()
  }

  private async finalize() {
    this.stop()
    if (!this.track) return
    await this.call('finalize', this.track)
  }

  private reset() {
    delete this.playStart
    this.pos = 0
    delete this.duration
    this.rate = 1
    delete this.track
    delete this.src
    delete this.initialStart
    this.waiting = false
  }

  public jumpTo(seconds: number, src?: string) {
    if (src && src !== this.src) return
    this.pos = seconds
    if (this.src) this.call('jump', seconds, this.src)
    this.scheduleEndCB()
  }

  public jumpBy(seconds: number, src?: string) {
    if (src && src !== this.src) return
    this.pos = clamp(0, this.getPosition() + seconds, this.duration ?? Infinity)
    this.playStart &&= Date.now()
    if (this.src) this.call('jump', this.getPosition(), this.src)
    this.scheduleEndCB()
  }

  public getPosition() {
    if (!this.playing || typeof this.pos !== 'number') return this.pos ?? 0
    return this.pos + ((Date.now() - this.playStart!) / 1000) * this.rate
  }

  private endedToId?: any

  public start() {
    if (this.playing || this.waiting) return
    if (!this.src) throw Error('no track selected')
    if (typeof this.pos !== 'number')
      throw Error("can't start from unknown position")
    this.waiting = true
    this.call('play', this.src, this.getPosition())
  }

  public stop() {
    if (!this.playing && !this.waiting) return
    this.pos = this.getPosition()
    delete this.playStart
    this.waiting = false
    this.call('stop')
    this.stopEndCB()
  }

  public isWaiting(seconds?: number) {
    if (!this.isPlaying) return
    this.pos = seconds ?? this.getPosition()
    delete this.playStart
    this.waiting = true
    this.call('waiting')
    this.stopEndCB()
  }

  public isPlaying(secs: number, ts: number) {
    this.pos = secs
    this.playStart = ts
    this.initialStart ??= ts
    this.waiting = false
    this.call('playing')
    this.scheduleEndCB()
  }

  private scheduleEndCB() {
    this.stopEndCB()
    logger.assert(this.duration)
    const id = (this.endedToId = setTimeout(() => {
      this.onEnded()
      clearTimeout(id)
      if (this.endedToId === id) delete this.endedToId
    }, (this.duration! - this.getPosition()) * 1000))
  }

  private stopEndCB() {
    if ('endedToId' in this) {
      clearTimeout(this.endedToId)
      delete this.endedToId
    }
  }

  private onEnded() {
    logger.info(`${this.track?.join(',')} playback finished`)
    this.stop()
    if (this.track) this.call('finished', [...this.track])
  }

  public setDuration(secs: number, src: string) {
    if (src !== this.src || secs === this.duration) return
    this.call('changeDuration', (this.duration = secs))
  }
}
