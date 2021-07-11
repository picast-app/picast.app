import EventEmitter from 'utils/event'
import equals from 'utils/equal'
import { store } from 'store'
import { bindThis } from 'utils/proto'

export type Events = {
  play: λ<[src: string, secs: number]>
  stop: λ<[]>
  playing: λ<[]>
  changeTrack: λ<[id: EpisodeId | null, src: string | null]>
  changeDuration: λ<[secs: number, updated: boolean]>
  jump: λ<[secs: number, src: string]>
}

export class VirtualPlayer extends EventEmitter<Events> {
  private track?: EpisodeId
  private src?: string
  private pos?: number
  private playStart?: number
  private rate = 1
  private duration?: number

  constructor() {
    super()
    bindThis(this)
  }

  public async setTrack(id: EpisodeId) {
    if (equals(this.track, id)) return
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

  public setPosition(seconds: number, src?: string) {
    if (src && src !== this.src) return
    this.pos = seconds
    if (this.src) this.call('jump', seconds, this.src)
  }

  public getPosition() {
    if (typeof this.playStart !== 'number' || typeof this.pos !== 'number')
      return this.pos ?? 0
    return this.pos + ((Date.now() - this.playStart) / 1000) * this.rate
  }

  public start() {
    if (!this.src) throw Error('no track selected')
    if (typeof this.pos !== 'number')
      throw Error("can't start from unknown position")
    this.call('play', this.src, this.getPosition())
  }

  public stop() {
    this.pos = this.getPosition()
    delete this.playStart
    this.call('stop')
  }

  public isPlaying(secs: number, ts: number) {
    this.pos = secs
    this.playStart = ts
    this.call('playing')
  }

  public setDuration(secs: number, src: string, updated = false) {
    if (src !== this.src || secs === this.duration) return
    this.call('changeDuration', (this.duration = secs), updated)
  }
}
