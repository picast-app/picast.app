import makeState, { PlayState } from 'audio/state'
import { asyncQueued } from 'utils/promise'

export interface Events extends HTMLElementEventMap {
  state: CustomEvent<PlayState>
  event: CustomEvent<AudioEvent>
  src: CustomEvent<string | null>
  buffered: CustomEvent<TimeRange[]>
}

export default class Audio extends HTMLElement {
  private audio: HTMLAudioElement
  public readonly state = makeState()

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.audio = document.createElement('audio')
    this.audio.preload = 'auto'
    this.audio.volume = 0.4
    this.shadowRoot!.append(this.audio)
    this.style.display = 'none'

    for (const [k, v] of Object.entries(this.handlers))
      this.audio.addEventListener(k, v)

    events.forEach(e =>
      this.audio.addEventListener(e, () => {
        this.handlers[e]?.()
        logger.info(`audio::${e}`)
        this.dispatch('event', e)
      })
    )

    this.state.onChange(state => {
      this.dispatch('state', state)
    })
  }

  static get observedAttributes() {
    return ['src', 'controls']
  }

  attributeChangedCallback(name: string, old: any, current: any) {
    if (old === current) return
    switch (name) {
      case 'src':
        if (current) this.audio.setAttribute(name, current)
        else this.audio.removeAttribute(name)
        this.dispatch('src', current || null)
        break
      case 'controls':
        this.style.display = current ? 'initial' : 'none'
        this.audio.toggleAttribute(name, current)
        break
    }
  }

  public addEventListener<T extends keyof Events>(
    type: T,
    listener: (event: Events[T]) => any,
    options?: boolean | AddEventListenerOptions
  ) {
    const target = ['state', 'event', 'src', 'buffered'].includes(type)
      ? Object.getPrototypeOf(Object.getPrototypeOf(this))
      : this.audio
    const ctx = target === this.audio ? target : this
    target.addEventListener.call(ctx, type, listener as λ, options)
    return () => target.removeEventListener.call(ctx, type, listener as λ)
  }

  private dispatch<T extends keyof Events>(
    type: T,
    payload: Events[T] extends CustomEvent<infer I> ? I : any
  ) {
    this.dispatchEvent(new CustomEvent(type, { detail: payload }))
  }

  public get src() {
    return this.audio.src
  }

  private toggleQueue = asyncQueued()

  public setSrc(src: string, position = 0) {
    this.audio.preload = 'none'
    this.audio.pause()
    this.setAttribute('src', src)
    this.audio.currentTime = position
    this.audio.preload = 'auto'
    this.audio.load()
  }

  public get volume() {
    return this.audio.volume
  }

  public set volume(n: number) {
    this.audio.volume = n
  }

  public get muted() {
    return this.audio.muted
  }

  public set muted(v: boolean) {
    this.audio.muted = v
  }

  public load() {
    this.audio.load()
  }

  public play = this.toggleQueue(async () => {
    if (this.src) await this.audio.play()
    else logger.warn('ignore play')
  })

  private playAborted = false

  public pause = this.toggleQueue(
    () => {
      this.audio.pause()
      this.playAborted = false
    },
    () => (this.playAborted = true)
  )

  public get buffered(): [start: number, end: number][] {
    const buffers = this.audio?.buffered
    const duration = this.audio?.duration ?? Infinity
    return [...Array(buffers?.length ?? 0)].map((_, i) => [
      buffers!.start(i) / duration,
      buffers!.end(i) / duration,
    ])
  }

  public get duration() {
    return this.audio.duration
  }

  public get time() {
    return this.audio.currentTime
  }

  public set time(seconds: number) {
    this.audio.currentTime = seconds
  }

  private handlers: { [K in AudioEvent]?: λ<[]> } = {
    playing: () => !this.playAborted && this.state.transition('playing'),
    play: () => this.state.transition('waiting'),
    waiting: () => this.state.transition('waiting'),
    pause: () => this.state.transition('paused'),
    emptied: () => this.state.transition('paused'),
    progress: () => {
      const ranges: TimeRange[] = [...Array(this.audio.buffered.length)].map(
        (_, i) => [this.audio.buffered.start(i), this.audio.buffered.end(i)]
      )
      this.dispatch('buffered', ranges)
    },
  }
}

// https://html.spec.whatwg.org/multipage/media.html#mediaevents
const events = [
  'canplay',
  'canplaythrough',
  'complete',
  'durationchange',
  'emptied',
  'ended',
  'loadeddata',
  'pause',
  'play',
  'playing',
  'ratechange',
  'seeked',
  'seeking',
  'stalled',
  'suspend',
  'volumechange',
  'waiting',
] as const
type AudioEvent = typeof events[number] | 'progress'
