import content from './template.html'
import Component from '../base.comp'
import type Progress from 'components/webcomponents/progressBar/progress.comp'
import type Audio from 'components/webcomponents/audio.comp'
import MediaSession from './components/mediaSession'
import Interaction from './components/interaction'
import StateListener from './components/stateListener'
import store from 'store/uiThread/api'
import { bindThis } from 'utils/proto'
import { PlayState } from 'audio/state'
import Job from 'utils/job'
import { main } from 'workers'
import serialAudio from 'audio/serialAdapter'
import { history } from '@picast-app/router'

export default class Player extends Component {
  static tagName = 'picast-player'
  static template = Player.createTemplate(content)

  private mediaSession = new MediaSession(this)
  private interaction = new Interaction(this)
  private stateListener = new StateListener(this)
  public audioAdapter = serialAudio()

  constructor() {
    super()
    bindThis(this)

    customElements.upgrade(this.shadowRoot!)

    this.audioAdapter.audio =
      this.shadowRoot!.querySelector<Audio>('picast-audio')!

    this.select<HTMLAnchorElement>('.title').forEach(el =>
      el.addEventListener('click', this.onTitleClick)
    )

    this.audioAdapter.addEventListener('buffered', this.onBufferedChange)
  }

  connectedCallback() {
    this.interaction.enable()
    this.mediaSession.enable()
    this.stateListener.enable()

    this.getProgressBars().forEach(this.attachBar)
    this.setAttribute('hidden', '')
    this.barObserver.observe(this, { childList: true, subtree: true })
  }

  disconnectedCallback() {
    this.interaction.disable()
    this.mediaSession.disable()
    this.stateListener.disable()

    this.progressBars.forEach(this.detachBar)
    this.barObserver.disconnect()
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

  private _visible = false
  public get visible() {
    return this._visible
  }
  public set visible(v: boolean) {
    if (this._visible === v) return
    this._visible = v
    if (v) this.removeAttribute('hidden')
    else this.setAttribute('hidden', '')
  }

  private readPlaybackPosition = new Job(30000, async () => {
    const pos = await main.player$getPosition()
    if (typeof pos === 'number') this.setProgressAttr('current', pos)
  })

  // events

  onPlayStateChange(state: PlayState) {
    this.setProgressAttr('loading', state === 'waiting')
    this.setProgressAttr('playing', state === 'playing')

    this.readPlaybackPosition.stop()
    this.readPlaybackPosition.once()
    if (state === 'playing') this.readPlaybackPosition.start(false)
  }

  async onEpisodeChange(id: EpisodeId | null) {
    if (!id) return

    this.mediaSession.showInfo(id)
    const episode = await store.getX('episodes.*', id[1])
    if (!episode?.file) throw Error(`can't find file for ${id[0]} ${id[1]}`)

    this.select<HTMLAnchorElement>('.title').forEach(el => {
      el.innerText = episode.title
      el.href = `?info=${episode.podcast}-${episode.id}`
    })

    this.setProgressAttr('playing', false)
    this.setProgressAttr('current', 0)
  }

  onTitleClick(e: MouseEvent) {
    e.preventDefault()

    const search = (e.currentTarget as HTMLAnchorElement).href?.match(
      /(\?.+?)(?=#|$)/
    )?.[0]
    if (search) history.push({ search })
  }

  onDurationChange(secs?: number) {
    if (!secs) return
    this.setProgressAttr('duration', secs)
  }

  onBufferedChange(ranges: TimeRange[]) {
    for (const bar of this.progressBars) {
      bar.buffered = ranges
      bar.scheduleFrame()
    }
  }

  onJump(seconds: number) {
    this.setProgressAttr('current', seconds)
  }

  // utils

  private progressBars: Progress[] = []

  private attachBar(bar: Progress) {
    bar.addEventListener('jump', this.onBarJump as any)
    this.progressBars.push(bar)
  }

  private detachBar(bar: Progress) {
    bar.removeEventListener('jump', this.onBarJump as any)
    this.progressBars = this.progressBars.filter(v => v !== bar)
  }

  private onBarJump(e: CustomEvent<number>) {
    main.player$jumpTo(e.detail, this.audioAdapter.audio?.src!)
  }

  private getProgressBars(): Progress[] {
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

  private barObserver = new MutationObserver(records => {
    const [addedBars, removedBars] = (
      ['addedNodes', 'removedNodes'] as const
    ).map(l =>
      records
        .flatMap(v => [...v[l]])
        .flatMap(v => [
          ...((v as any).querySelectorAll?.('player-progress') ?? []),
        ])
    )
    addedBars.forEach(this.attachBar)
    removedBars.forEach(this.detachBar)
  })

  private setProgressAttr(name: string, value: string | number | boolean) {
    for (const bar of this.progressBars) {
      bar.setAttribute(name, value.toString())
    }
  }

  private select<T extends HTMLElement>(selector: string): T[] {
    return Array.from(this.shadowRoot!.querySelectorAll<T>(selector))
  }
}
