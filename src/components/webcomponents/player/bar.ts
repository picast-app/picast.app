import html from './bar.html'
import { main, proxy } from 'workers'
import { playerSub } from 'utils/player'
import type { Podcast } from 'main/store/types'
import type Progress from './progress'
import {
  GestureController,
  VerticalSwipe,
  UpwardSwipe,
  DownwardSwipe,
} from 'interaction/gesture/gestures'
import { animateTo } from 'utils/animate'
import { transitionStates } from './animation'
import { setQueryParam, removeQueryParam } from 'utils/url'
import { desktop } from 'styles/responsive'
import history from 'utils/history'

const tmpl = document.createElement('template')
tmpl.innerHTML = html

export default class Player extends HTMLElement {
  public podcast?: Podcast
  public episode?: EpisodeMin
  public readonly audio: HTMLAudioElement
  private readonly fullscreen: HTMLElement
  private mainnav = document.getElementById('mainnav')!
  private gesture?: GestureController<UpwardSwipe | DownwardSwipe>
  private isFullscreen = location.search.includes('view=player')
  private touchBoxes: HTMLElement[] = []
  private session?: EpisodeId
  private isDesktop: boolean

  constructor() {
    super()
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.appendChild(tmpl.content.cloneNode(true))

    this.syncProgress = this.syncProgress.bind(this)
    this.forcedSync = this.forcedSync.bind(this)
    this.onStateChange = this.onStateChange.bind(this)
    this.play = this.play.bind(this)
    this.pause = this.pause.bind(this)
    this.transition = this.transition.bind(this)
    this.onSwipe = this.onSwipe.bind(this)
    this.onClick = this.onClick.bind(this)
    this.onPopState = this.onPopState.bind(this)
    this.onProgress = this.onProgress.bind(this)
    this.onBarJump = this.onBarJump.bind(this)
    this.onTitleClick = this.onTitleClick.bind(this)

    this.fullscreen = this.shadowRoot!.querySelector<HTMLElement>(
      '.fullscreen'
    )!
    this.audio = this.shadowRoot!.querySelector('audio')!

    main.state('playing', proxy(this.onStateChange as any))
    this.audio.addEventListener('durationchange', () => {
      this.setProgressAttr('duration', this.audio.duration)
    })
    this.audio.addEventListener('seek', this.syncProgress)
    this.audio.addEventListener('ended', () => {
      this.pause()
      main.setPlaying(null)
    })
    this.audio.addEventListener('progress', this.onProgress)

    this.audio.addEventListener('playing', () => {
      this.setProgressAttr('current', this.audio.currentTime)
      this.setProgressAttr('playing', true)
    })
    this.audio.addEventListener('pause', () => {
      this.setProgressAttr('current', this.audio.currentTime)
      this.setProgressAttr('playing', false)
    })

    const container = (this.shadowRoot!.getElementById(
      'touchbox'
    ) as HTMLTemplateElement).content
    this.touchBoxes.push(container.getElementById('closed')!)
    this.touchBoxes.push(container.getElementById('extended')!)

    const q = window.matchMedia(desktop)
    this.isDesktop = q.matches
    q.onchange = v => {
      this.isDesktop = v.matches
      this.removeEventListener('click', this.onClick)
      if (!this.isDesktop) this.addEventListener('click', this.onClick)
    }

    this.shadowRoot
      ?.querySelectorAll('.title')
      .forEach(title => title.addEventListener('click', this.onTitleClick))

    playerSub.setState(this)

    new MutationObserver(records => {
      const [addedBars, removedBars] = ([
        'addedNodes',
        'removedNodes',
      ] as const).map(l =>
        records
          .flatMap(v => [...v[l]])
          .flatMap(v => [
            ...((v as any).querySelectorAll?.('player-progress') ?? []),
          ])
      )
      for (const bar of addedBars) {
        bar.addEventListener('jump', this.onBarJump as any)
        bar.setAttribute('current', this.audio.currentTime)
      }
      for (const bar of removedBars)
        bar.removeEventListener('jump', this.onBarJump as any)
    }).observe(this, { childList: true, subtree: true })
  }

  connectedCallback() {
    logger.info('player connected')
    this.initMediaHandlers()
    if (!this.isDesktop) this.addEventListener('click', this.onClick)
    this.attachGesture()
    window.addEventListener('popstate', this.onPopState)
    this.audio.volume = 0.4
    window.addEventListener('pagehide', this.forcedSync)
    this.progressBars.forEach(bar =>
      bar.addEventListener('jump', this.onBarJump as any)
    )
    this.setAttribute('hidden', '')
    this.mainnav = document.getElementById('mainnav')!

    if (this.isFullscreen) {
      this.style.transform = transitionStates[1].bar.transform as string
      this.mainnav.style.transform = transitionStates[1].nav.transform as string
      this.fullscreen.style.transform = transitionStates[1].fullscreen
        .transform as string
    }
  }

  disconnectedCallback() {
    logger.info('player disconnected')
    this.detachGesture()
    this.removeEventListener('click', this.onClick)
    this.removeMediaHandlers()
    window.removeEventListener('popstate', this.onPopState)
    window.removeEventListener('pagehide', this.forcedSync)
    this.progressBars.forEach(bar =>
      bar.removeEventListener('jump', this.onBarJump as any)
    )
  }

  static get observedAttributes() {
    return ['theme']
  }

  attributeChangedCallback(name: string, old: string, current: string) {
    if (name !== 'theme') return
    for (const bar of this.progressBars) {
      bar.setAttribute('theme', current)
    }
  }

  public get playing(): boolean {
    return !this.audio.paused
  }

  private async onStateChange({
    episode,
    podcast,
  }: {
    episode: EpisodeMin
    podcast: Podcast
  }) {
    if (this.episode?.id === episode?.id) return
    this.podcast = podcast
    this.episode = episode

    if (!episode) {
      this.setAttribute('hidden', '')
      return
    }
    this.title = episode.title
    this.removeAttribute('hidden')

    const current = (episode.relProg ?? 0) >= 1 ? 0 : episode.currentTime ?? 0
    this.setProgressAttr('current', current)
    this.audio.src = episode.file
    this.audio.currentTime = current
    await this.waitForTrack(episode.file)
    this.dispatchEvent(
      new CustomEvent('episodeChange', { detail: [podcast.id, episode.id] })
    )
  }

  async waitForTrack(track?: string) {
    const isTrack = () =>
      track ? this.audio.currentSrc === track : !!this.audio.currentSrc

    if (isTrack()) return

    await new Promise<void>(res => {
      const handler = () => {
        if (!isTrack) return
        this.audio.removeEventListener('canplay', handler)
        res()
      }
      this.audio.addEventListener('canplay', handler)
    })
  }

  async waitForEpisode([pod, ep]: EpisodeId) {
    await new Promise<void>(res => {
      const listener = ({ detail }: CustomEvent<EpisodeId>) => {
        if (detail[0] !== pod || detail[1] !== ep) return
        this.removeEventListener('episodeChange', listener as any)
        res()
      }
      this.addEventListener('episodeChange', listener as any)
    })
  }

  set title(v: string) {
    this.shadowRoot?.querySelectorAll('.title').forEach(node => {
      node.textContent = v
    })
  }

  get progressBars() {
    return [
      ...Array.from(
        this.shadowRoot!.querySelectorAll<Progress>('player-progress')
      ),
      ...this.shadowRoot!.querySelector<HTMLSlotElement>(
        "slot[name='fullscreen']"
      )!
        .assignedElements()
        .flatMap(node =>
          Array.from(node.querySelectorAll<Progress>('player-progress'))
        ),
    ]
  }

  private setProgressAttr(name: string, value: string | number | boolean) {
    for (const bar of this.progressBars) {
      bar.setAttribute(name, value.toString())
    }
  }

  public async play(id?: EpisodeId) {
    this.dispatchEvent(new Event('play'))

    if (id) {
      if (id[0] !== this.podcast?.id || id[1] !== this.episode?.id) {
        this.dispatchEvent(new CustomEvent('episodeChange', { detail: id }))
        const changed = this.waitForEpisode(id)
        main.setPlaying(id)
        await changed
      }
    }

    await this.audio.play()
    if (navigator.mediaSession) navigator.mediaSession.playbackState = 'playing'
    this.setMediaMeta()
    this.syncProgress()
  }

  public async pause() {
    this.audio.pause()
    if (navigator.mediaSession) navigator.mediaSession.playbackState = 'paused'
    await this.syncProgress()
    this.dispatchEvent(new Event('pause'))
  }

  public jump(pos: number, relative = false) {
    if (relative) pos = this.audio.currentTime + pos
    this.audio.currentTime = pos
    this.syncProgress()
    this.progressBars.forEach(el => {
      el.jump(pos)
    })
  }

  private syncId?: number

  private async syncProgress() {
    if (this.syncId) {
      clearTimeout(this.syncId)
      delete this.syncId
    }

    if (this.episode?.file !== this.audio.currentSrc)
      throw Error('episode mismatch')
    await main.setProgress(this.audio.currentTime)

    if (this.playing) this.syncId = setTimeout(this.syncProgress, 5000)
  }

  private async forcedSync() {
    await main.setProgress(this.audio.currentTime, true)
  }

  private onClick(e: MouseEvent) {
    if (e.target !== this && (e.target as any).slot !== 'info') return
    this.transition('extend')
  }

  private transition(dir: 'extend' | 'close') {
    const opts = {
      duration: 350,
      easing: 'ease',
    } as const

    const i = dir === 'extend' ? 1 : 0
    animateTo(this, transitionStates[i].bar, opts, () =>
      this.onFullscreenChange(dir === 'extend')
    )
    animateTo(this.fullscreen, transitionStates[i].fullscreen, opts)
    animateTo(this.mainnav, transitionStates[i].nav, opts)
  }

  private setTransitionPos(y: number) {
    const height = window.innerHeight - PLAYER_HEIGHT
    if (y <= 0 && this.isFullscreen) y = height + y
    const n = Math.max(Math.min(y / height, 1), 0)
    y = n * height

    const player = `-${Math.round(y)}px + ${(n * 100) | 0}%`
    const full = `${-n} * var(--player-height)`
    const nav = `${Math.min(y, BAR_HEIGHT)}px`

    this.style.transform = n === 0 ? '' : `translateY(calc(${player}))`
    this.fullscreen.style.transform = `translateY(calc(${full}))`
    this.mainnav.style.transform = `translateY(${nav})`
  }

  private onSwipe(gesture: VerticalSwipe) {
    this.gesture!.removeEventListener('start', this.onSwipe)

    gesture.addEventListener('end', () => {
      this.gesture!.addEventListener('start', this.onSwipe)
      let frac = gesture.lastY / (window.innerHeight - BAR_HEIGHT)
      if (frac < 0) frac += 1
      let vel = gesture.velocity
      if (Math.abs(vel) < 3) vel = 0
      if (frac === 0) return
      this.transition(
        vel > 0 ? 'extend' : vel < 0 ? 'close' : frac < 0.5 ? 'close' : 'extend'
      )
    })

    gesture.addEventListener('move', off => {
      this.setTransitionPos(off)
    })
  }

  private onFullscreenChange(fullscreen: boolean) {
    if (fullscreen === this.isFullscreen) return
    this.detachGesture()
    this.isFullscreen = fullscreen
    this.attachGesture()
    if (fullscreen) setQueryParam('view', 'player')
    else removeQueryParam('view', true)
  }

  private onPopState() {
    const fullscreen = location.search.includes('view=player')
    if (fullscreen === this.isFullscreen) return
    this.transition(fullscreen ? 'extend' : 'close')
  }

  private getTouchBox(full: 'extended' | 'closed'): HTMLElement {
    return this.touchBoxes[full === 'closed' ? 0 : 1]
  }

  private attachGesture() {
    this.gesture = new GestureController(
      this.isFullscreen ? DownwardSwipe : UpwardSwipe,
      this.getTouchBox(this.isFullscreen ? 'extended' : 'closed')
    )
    this.gesture.start()
    this.gesture.addEventListener('start', this.onSwipe)
  }

  private detachGesture() {
    if (!this.gesture) return
    this.gesture.removeEventListener('start', this.onSwipe)
    this.gesture.stop()
    delete this.gesture
  }

  private setMediaMeta() {
    if (!navigator.mediaSession || !this.podcast || !this.episode) return
    if (
      this.session?.[0] === this.podcast.id &&
      this.session?.[1] === this.episode.id
    )
      return
    this.session = [this.podcast.id, this.episode.id]

    const meta: MediaMetadata = new MediaMetadata({
      title: this.episode.title,
      artist: this.podcast.author!,
      album: this.podcast.title,
      artwork: this.podcast.covers.map(src => ({
        src: `${process.env.IMG_HOST}/${src}`,
        type: `image/${src.split('.').pop()}`,
        sizes: Array(2).fill(src.split('.')[0].split('-').pop()).join('x'),
      })),
    })
    navigator.mediaSession.metadata = meta

    navigator.mediaSession.setPositionState?.({
      duration: this.audio.duration,
      playbackRate: 1,
      position: this.audio.currentTime,
    })
  }

  private initMediaHandlers() {
    if (!navigator.mediaSession) return
    navigator.mediaSession.setActionHandler('play', () => this.play())
    navigator.mediaSession.setActionHandler('pause', this.pause)
    navigator.mediaSession.setActionHandler('stop', this.pause)
    navigator.mediaSession.setActionHandler('nexttrack', () =>
      this.jump(30, true)
    )
    navigator.mediaSession.setActionHandler('previoustrack', () =>
      this.jump(-15, true)
    )
  }

  private removeMediaHandlers() {
    if (!navigator.mediaSession) return
    navigator.mediaSession.setActionHandler('play', null)
    navigator.mediaSession.setActionHandler('pause', null)
    navigator.mediaSession.setActionHandler('stop', null)
    navigator.mediaSession.setActionHandler('nexttrack', null)
    navigator.mediaSession.setActionHandler('previoustrack', null)
    navigator.mediaSession.setPositionState?.()
  }

  private onProgress() {
    const ranges = this.bufferRanges()
    for (const bar of this.progressBars) {
      bar.buffered = ranges
      bar.scheduleFrame()
    }
  }

  private bufferRanges() {
    const ranges: [number, number][] = []
    for (let i = 0; i < this.audio.buffered.length; i++) {
      ranges.push([
        this.audio.buffered.start(i) / this.audio.duration,
        this.audio.buffered.end(i) / this.audio.duration,
      ])
    }
    return ranges
  }

  private onBarJump(e: CustomEvent<number>) {
    this.jump((e as CustomEvent<number>).detail)
  }

  private onTitleClick() {
    if (!this.episode || !this.podcast) return
    const params = new URLSearchParams(location.search)
    params.set('info', `${this.podcast.id}-${this.episode.id}`)
    const path = `${location.pathname}?${params.toString()}`
    if (location.pathname + location.search !== path) history.push(path)
  }
}

customElements.define('picast-player', Player)

const PLAYER_HEIGHT = 4 * 16
const BAR_HEIGHT = 4 * 16
