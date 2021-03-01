import html from './bar.html'
import { main, proxy } from 'workers'
import { playerSub } from 'utils/player'
import type { Podcast } from 'main/store/types'

const tmpl = document.createElement('template')
tmpl.innerHTML = html

export default class Player extends HTMLElement {
  public readonly audio: HTMLAudioElement
  public podcast?: Podcast
  public episode?: EpisodeMin

  constructor() {
    super()
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.appendChild(tmpl.content.cloneNode(true))

    this.syncProgress = this.syncProgress.bind(this)
    this.onStateChange = this.onStateChange.bind(this)
    this.play = this.play.bind(this)
    this.pause = this.pause.bind(this)

    this.audio = this.shadowRoot!.querySelector('audio')!
    this.audio.volume = 0.4

    main.state('playing', proxy(this.onStateChange as any))
    this.audio.addEventListener('durationchange', () => {
      this.setProgressAttr('duration', this.audio.duration)
    })
    this.audio.addEventListener('seek', this.syncProgress)
    this.audio.addEventListener('ended', this.pause)

    playerSub.setState(this)
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
    this.title = episode.title

    if (!episode) return

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

  private setProgressAttr(name: string, value: string | number | boolean) {
    this.shadowRoot!.querySelectorAll('player-progress').forEach(el => {
      el.setAttribute(name, value.toString())
    })
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
  }

  public async pause() {
    this.audio.pause()
    await this.syncProgress()
    this.dispatchEvent(new Event('pause'))
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
}

customElements.define('picast-player', Player)
