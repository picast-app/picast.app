import content from './template.html'
import Component from '../base.comp'
import { main, proxy } from 'workers'
import { playerSub } from 'utils/player'
import type { Podcast } from 'main/store/types'
import type Progress from 'components/webcomponents/progressBar/progress.comp'
import { bindThis } from 'utils/proto'
import MediaSession from './components/mediaSession'
import Interaction from './components/interaction'

export default class Player extends Component {
  public podcast?: Podcast
  public episode?: EpisodeMin
  public readonly audio: HTMLAudioElement

  private mediaSession = new MediaSession(this)
  private interaction = new Interaction(this)

  static tagName = 'picast-player'
  static template = Player.createTemplate(content)

  constructor() {
    super()
    bindThis(this)

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
    this.interaction.start()
    this.mediaSession.start()

    this.audio.volume = 0.4
    window.addEventListener('pagehide', this.forcedSync)
    this.progressBars.forEach(bar =>
      bar.addEventListener('jump', this.onBarJump as any)
    )
    this.setAttribute('hidden', '')
  }

  disconnectedCallback() {
    this.interaction.stop()
    this.mediaSession.stop()

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
}
