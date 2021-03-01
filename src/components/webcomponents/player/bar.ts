import html from './bar.html'
import { main, proxy } from 'workers'
import { playerSub } from 'utils/player'
import type { Podcast } from 'main/store/types'

const tmpl = document.createElement('template')
tmpl.innerHTML = html

export default class Player extends HTMLElement {
  private readonly audio: HTMLAudioElement
  public podcast?: Podcast
  public episode?: EpisodeMin

  constructor() {
    super()
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.appendChild(tmpl.content.cloneNode(true))
    this.audio = this.shadowRoot!.querySelector('audio')!

    main.state('playing', proxy(this.onStateChange.bind(this) as any))
    this.audio.addEventListener('durationchange', () => {
      this.setProgressAttr('duration', this.audio.duration)
    })
    this.audio.volume = 0.4

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

    this.setProgressAttr('current', episode.currentTime ?? 0)
    this.audio.src = episode.file
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
        logger.info('changed', this.episode?.title)
      }
    }

    await this.audio.play()
  }

  public pause() {
    this.dispatchEvent(new Event('pause'))
    this.audio.pause()
  }
}

customElements.define('picast-player', Player)
