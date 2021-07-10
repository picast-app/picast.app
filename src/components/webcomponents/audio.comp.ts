import makeState, { PlayState } from 'audio/state'
import { asyncQueued } from 'utils/promise'

interface Events extends HTMLElementEventMap {
  state: CustomEvent<PlayState>
  event: CustomEvent<AudioEvent>
  src: CustomEvent<string | null>
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
    const target = ['state', 'event', 'src'].includes(type)
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

  public set src(src: string | null) {
    logger.info('set src', src)
    if (src) this.setAttribute('src', src)
    else {
      this.removeAttribute('src')
      this.pause()
    }
  }

  private toggleQueue = asyncQueued()

  public play = this.toggleQueue(async () => {
    logger.info('audio.play')
    if (this.src) await this.audio.play()
    else logger.warn('ignore play')
  })

  private playAborted = false

  public pause = this.toggleQueue(
    () => {
      logger.info('audio.pause')
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
    play: () => this.state.transition('waiting'),
    playing: () => !this.playAborted && this.state.transition('playing'),
    pause: () => this.state.transition('paused'),
    emptied: () => this.state.transition('paused'),
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
type AudioEvent = typeof events[number]
