import Service from './base'

interface PlaybackController {
  play(src: string, pos?: number): Promise<void>
  resume(): Promise<void>
  pause(): void
  setSrc(src: string): void
}

export default class Audio extends Service implements PlaybackController {
  private audio?: HTMLAudioElement
  private waitTOs: number[] = []
  private _playing = false
  private _waiting = false

  // service interface

  public enable() {
    this.log?.('enable')
    if (this.audio) throw Error('audio service already enabled')
    const audio = (this.audio = this.player.shadowRoot!.querySelector<HTMLAudioElement>(
      'audio'
    )!)
    this._playing = !this.audio.paused

    audio.addEventListener('durationchange', this.onDurationChange)
    audio.addEventListener('seeked', this.player.syncProgress)
    audio.addEventListener('ended', this.onEnd)
    audio.addEventListener('progress', this.onBufferedUpdate)
    audio.addEventListener('playing', this.onPlaying)
    audio.addEventListener('pause', this.onPaused)
    audio.addEventListener('waiting', this.onWaiting)
    Audio.tracked.forEach(event => audio.addEventListener(event, this.logEvent))
  }

  public disable = this.audioGuard(() => {
    this.log?.('disable')
    const audio = this.audio!
    audio.removeEventListener('durationchange', this.onDurationChange)
    audio.removeEventListener('seeked', this.player.syncProgress)
    audio.removeEventListener('ended', this.onEnd)
    audio.removeEventListener('progress', this.onBufferedUpdate)
    audio.removeEventListener('playing', this.onPlaying)
    audio.removeEventListener('pause', this.onPaused)
    audio.removeEventListener('waiting', this.onWaiting)
    Audio.tracked.forEach(event =>
      audio.removeEventListener(event, this.logEvent)
    )
    delete this.audio
  })

  // common audio interface

  public setSrc = this.audioGuard((src: string | null, pos = 0) => {
    this.log?.('set src', src)
    if (src) {
      this.audio!.src = src
      this.audio!.currentTime = pos
    } else this.audio!.removeAttribute('src')
  })

  public play = this.audioGuard(async (src: string, pos = 0) => {
    this.log?.('play', src)
    this.audio!.src = src
    this.audio!.currentTime = pos
    await this.audio!.play()
  })

  public resume = this.audioGuard(async () => {
    this.log?.('resume')
    await this.audio!.play()
  })

  public pause = this.audioGuard(() => {
    this.log?.('pause')
    this.audio!.pause()
  })

  // events

  private onDurationChange() {
    this.log?.('duration changed to', this.audio!.duration)
    this.player?.onDurationChange(this.audio!.duration)
  }

  private onEnd() {
    this.log?.('ended')
    this.player?.onEnded()
  }

  private onBufferedUpdate() {
    this.player?.onBufferedChange()
  }

  private onPlaying() {
    this.log?.('playing')
    this.waitTOs.forEach(id => clearTimeout(id))
    this.waitTOs = []
    if (this._waiting) this.player?.onLoading(false)
    this._waiting = false
    if (this._playing) return
    this._playing = true
    this.player?.onPlaying()
  }

  private onPaused() {
    this.log?.('paused')
    if (!this._playing) return
    this._playing = false
    this.player?.onPaused()
  }

  private onWaiting() {
    const toId = setTimeout(() => {
      this.log?.('waiting')
      this.waitTOs.splice(this.waitTOs.indexOf(toId), 1)
      this._playing = false
      this.player?.onPaused()
      if (!this._waiting) this.player?.onLoading(true)
      this._waiting = true
    }, 50)
    this.waitTOs.push(toId)
  }

  // audio prop accessors

  public get src() {
    return this.audio?.src
  }

  public get time() {
    return this.audio?.currentTime ?? 0
  }

  public set time(n: number) {
    if (!this.audio) return
    this.log?.('jump to', n)
    this.audio.currentTime = n
  }

  public get duration() {
    return this.audio?.duration ?? Infinity
  }

  public get buffered(): [start: number, end: number][] {
    const buffers = this.audio?.buffered
    const duration = this.audio?.duration ?? Infinity
    return [...Array(buffers?.length ?? 0)].map((_, i) => [
      buffers!.start(i) / duration,
      buffers!.end(i) / duration,
    ])
  }

  public get volume() {
    return this.audio?.volume ?? 0
  }

  public set volume(v: number) {
    if (this.audio) this.audio.volume = v
  }

  public isPlaying() {
    return this._playing
  }

  // private utils

  private audioGuard<T extends (...args: any[]) => any>(method: T): T {
    return ((...args: Parameters<T>) => {
      if (!this.audio) throw Error('no audio element connected')
      return method(...args)
    }) as T
  }

  private log?(...args: any[]) {
    logger.info('[audio]:', ...args)
  }

  private logEvent(event: Event) {
    this.log?.(`"${event.type}"`)
  }

  // https://html.spec.whatwg.org/multipage/media.html#mediaevents
  private static tracked: string[] = [
    'canplay',
    'canplaythrough',
    'complete',
    'emptied',
    'loadeddata',
    'play',
    'ratechange',
    'seeking',
    'stalled',
    'suspend',
    'volumechange',
  ]
}
