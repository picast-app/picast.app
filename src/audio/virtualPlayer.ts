import EventEmitter from 'utils/event'
import equals from 'utils/equal'
import { store } from 'store'
import { bindThis } from 'utils/proto'
import { clamp } from 'lodash'

export type Events = {
  play: λ<[src: string, secs: number]>
  stop: λ<[]>
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
    const file = await store.get('episodes.*.*.file', ...id)
    if (!file) throw Error(`can't find file for ${id[0]} ${id[1]}`)
    this.src = file
    this.setDuration(
      (await store.get('episodes.*.*.duration', ...id)) ?? 1200,
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
  }

  public jumpBy(seconds: number, src?: string) {
    if (src && src !== this.src) return
    this.pos = clamp(0, this.getPosition() + seconds, this.duration ?? Infinity)
    this.playStart &&= Date.now()
    if (this.src) this.call('jump', this.getPosition(), this.src)
  }

  public getPosition() {
    if (!this.playing || typeof this.pos !== 'number') return this.pos ?? 0
    return this.pos + ((Date.now() - this.playStart!) / 1000) * this.rate
  }

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
  }

  public isWaiting(seconds?: number) {
    if (!this.isPlaying) return
    this.pos = seconds ?? this.getPosition()
    delete this.playStart
    this.waiting = true
    this.call('waiting')
  }

  public isPlaying(secs: number, ts: number) {
    this.pos = secs
    this.playStart = ts
    this.initialStart ??= ts
    this.waiting = false
    this.call('playing')
  }

  public setDuration(secs: number, src: string) {
    if (src !== this.src || secs === this.duration) return
    this.call('changeDuration', (this.duration = secs))
  }
}
