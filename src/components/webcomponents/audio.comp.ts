import { Machine } from 'utils/state'

type PlayState = 'paused' | 'waiting' | 'playing'

interface Events extends HTMLElementEventMap {
  state: CustomEvent<PlayState>
  event: CustomEvent<AudioEvent>
}

export default class Audio extends HTMLElement {
  private audio: HTMLAudioElement
  private state = Audio.makeState()

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot!.append((this.audio = document.createElement('audio')))

    for (const [k, v] of Object.entries(this.handlers))
      this.audio.addEventListener(k, v)

    events.forEach(e =>
      this.audio.addEventListener(e, () => {
        this.handlers[e]?.()
        this.dispatch('event', e)
      })
    )

    this.state.onChange(state => {
      logger.info({ state })
      this.dispatch('state', state)
    })
  }

  static get observedAttributes() {
    return ['src', 'controls']
  }

  private attributeChangedCallback(name: string, old: any, current: any) {
    switch (name) {
      case 'src':
        if (current) this.audio.setAttribute(name, current)
        else this.audio.removeAttribute(name)
        break
      case 'controls':
        this.audio.toggleAttribute(name, current)
        break
    }
  }

  public addEventListener<T extends keyof Events>(
    type: T,
    listener: (event: Events[T]) => any,
    options?: boolean | AddEventListenerOptions
  ) {
    super.addEventListener(type, listener as λ, options)
    return () => super.removeEventListener(type, listener as λ)
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

  public set src(src: string) {
    this.setAttribute('src', src)
  }

  public play() {
    this.audio.play()
  }

  public pause() {
    this.audio.pause()
  }

  private handlers: { [K in AudioEvent]?: λ<[]> } = {
    play: () => this.state.transition('waiting'),
    playing: () => this.state.transition('playing'),
    pause: () => this.state.transition('paused'),
  }

  private static makeState(): Machine<PlayState> {
    const sm = new Machine<PlayState>('paused')
    sm.addTransition('paused', 'waiting')
    sm.addTransition('waiting', 'playing')
    sm.addTransition('playing', 'paused')
    sm.addTransition('playing', 'waiting')
    sm.addTransition('waiting', 'paused')
    return sm
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
  'progress',
  'ratechange',
  'seeked',
  'seeking',
  'stalled',
  'suspend',
  'volumechange',
  'waiting',
] as const
type AudioEvent = typeof events[number]
