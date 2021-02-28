import html from './bar.html'
import { main, proxy } from 'workers'
import type { Podcast } from 'main/store/types'

const tmpl = document.createElement('template')
tmpl.innerHTML = html

export default class Player extends HTMLElement {
  private readonly audio: HTMLAudioElement
  private podcast?: Podcast
  private episode?: EpisodeMin

  constructor() {
    super()
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.appendChild(tmpl.content.cloneNode(true))
    this.audio = this.shadowRoot!.querySelector('audio')!

    main.state('playing', proxy(this.onStateChange.bind(this) as any))
    this.audio.addEventListener('durationchange', () => {
      this.setProgressAttr('duration', this.audio.duration)
    })
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
  }

  async waitForTrack(track: string) {
    if (this.audio.currentSrc === track) return

    await new Promise<void>(res => {
      const handler = () => {
        if (this.audio.currentSrc !== track) return
        this.audio.removeEventListener('canplay', handler)
        res()
      }
      this.audio.addEventListener('canplay', handler)
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
}

customElements.define('picast-player', Player)
