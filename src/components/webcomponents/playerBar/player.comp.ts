import content from './template.html'
import Component from '../base.comp'
import { main, proxy } from 'workers'
import { playerSub } from 'utils/player'
import type { Podcast } from 'main/store/types'
import type Progress from 'components/webcomponents/progressBar/progress.comp'
import {
  GestureController,
  VerticalSwipe,
  UpwardSwipe,
  ExclusiveDownwardSwipe,
} from 'interaction/gesture/gestures'
import { animateTo } from 'utils/animate'
import { transitionStates } from './animation'
import { setUrl } from 'routing/url'
import { desktop } from 'styles/responsive'
import history from 'routing/history'
import { bindThis } from 'utils/proto'
import MediaSession from './components/mediaSession'

export default class Player extends Component {
  public podcast?: Podcast
  public episode?: EpisodeMin
  public readonly audio: HTMLAudioElement
  private readonly fullscreen: HTMLElement
  private mainnav = document.getElementById('mainnav')!
  private gesture?: GestureController<UpwardSwipe | ExclusiveDownwardSwipe>
  private isFullscreen = isFullscreen()
  private touchBoxes: HTMLElement[] = []
  private isDesktop: boolean
  private mediaSession = new MediaSession(this)

  static tagName = 'picast-player'
  static template = Player.createTemplate(content)

  constructor() {
    super()
    bindThis(this)

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
      if (v.matches && this.isFullscreen) this.setFullscreenTransform(false)
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

    history.listen(() => {
      if (this.isDesktop) return
      if (isFullscreen() !== this.isFullscreen) {
        logger.info('player fullscreen transition')
        this.transition(this.isFullscreen ? 'close' : 'extend')
      }
    })
  }

  connectedCallback() {
    logger.info('player connected')
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

    if (this.isFullscreen && !this.isDesktop) this.setFullscreenTransform(true)
  }

  disconnectedCallback() {
    logger.info('player disconnected')
    this.detachGesture()
    this.removeEventListener('click', this.onClick)
    this.mediaSession.stop()
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
    this.syncProgress()
    this.mediaSession.showInfo()
  }

  public async pause() {
    this.audio.pause()
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

  private setFullscreenTransform(fs: boolean) {
    this.style.transform = transitionStates[+fs].bar.transform as string
    this.mainnav.style.transform = transitionStates[+fs].nav.transform as string
    this.fullscreen.style.transform = transitionStates[+fs].fullscreen
      .transform as string
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

    gesture.addEventListener('end', cancelled => {
      this.gesture!.addEventListener('start', this.onSwipe)
      if (cancelled) return
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
    if (this.isFullscreen !== isFullscreen())
      setUrl({ hash: fullscreen ? 'playing' : null })
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
      this.isFullscreen ? ExclusiveDownwardSwipe : UpwardSwipe,
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

const PLAYER_HEIGHT = 4 * 16
const BAR_HEIGHT = 4 * 16

function isFullscreen() {
  return ['notes', 'playing', 'queue'].includes(
    location.hash?.slice(1)?.toLowerCase()
  )
}
