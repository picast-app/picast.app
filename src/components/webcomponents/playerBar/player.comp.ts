import content from './template.html'
import Component from '../base.comp'
import type Progress from 'components/webcomponents/progressBar/progress.comp'
import type Audio from 'components/webcomponents/audio.comp'
import MediaSession from './components/mediaSession'
import Interaction from './components/interaction'
import StateListener from './components/stateListener'
import store from 'store/uiThread/api'
import { bindThis } from 'utils/proto'
import { PlayState } from 'utils/audioState'
import { timeLimit } from 'utils/promise'
import Job from 'utils/job'
// import { time } from 'utils/decorators'

export default class Player extends Component {
  static tagName = 'picast-player'
  static template = Player.createTemplate(content)

  private mediaSession = new MediaSession(this)
  private interaction = new Interaction(this)
  private stateListener = new StateListener(this)
  // private events = new EventDispatcher()
  private audio = this.shadowRoot!.querySelector<Audio>('picast-audio')!

  constructor() {
    super()
    bindThis(this)

    customElements.upgrade(this.shadowRoot!)

    this.audio.addEventListener('state', ({ detail }) =>
      this.onAudioStateChange(detail)
    )
    this.audio.addEventListener('progress', this.onBufferedChange)

    this.audio.addEventListener('durationchange', () =>
      this.setProgressAttr('duration', this.audio.duration)
    )
  }

  connectedCallback() {
    this.interaction.enable()
    this.mediaSession.enable()
    this.stateListener.enable()

    // window.addEventListener('pagehide', this.forcedSync)
    this.progressBars.forEach(bar =>
      bar.addEventListener('jump', this.onBarJump as any)
    )
    this.setAttribute('hidden', '')
    this.barObserver.observe(this, { childList: true, subtree: true })
  }

  disconnectedCallback() {
    this.interaction.disable()
    this.mediaSession.disable()
    this.stateListener.disable()

    // window.removeEventListener('pagehide', this.forcedSync)
    this.progressBars.forEach(bar =>
      bar.removeEventListener('jump', this.onBarJump as any)
    )
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

  private currentTimeJob = new Job(30000, () => {
    this.setProgressAttr('current', this.audio.time)
  })

  public jump(pos: number, relative = false) {
    // if (relative) pos = this.audioService.time + pos
    // this.audioService.time = pos
    // logger.info('jump to', pos)
    // this.setProgressAttr('current', pos)
    // this.events.call('jump', pos, this.currentId)
    // this.syncProgress()
  }

  // events

  async onPlayStateChange(state: PlayState) {
    this.setProgressAttr('loading', state === 'waiting')
    if ((state === 'paused') !== (this.audio.state.current === 'paused')) {
      if (state === 'paused') this.audio.pause()
      else {
        await timeLimit(1000, this.waitForSrc(await this.getSrc()))
        await this.audio.play()
      }
    }
  }

  onAudioStateChange(state: PlayState) {
    if (state === 'playing') this.currentTimeJob.start()
    else this.currentTimeJob.stop()
    this.setProgressAttr('playing', state === 'playing')
    if (state === 'paused') return
    store.setX('player.status', state)
  }

  async onEpisodeChange(id: EpisodeId | null) {
    if (!id) return (this.audio.src = null)

    this.audio.pause()
    const episode = await store.getX('episodes.*.*', ...id)
    if (!episode?.file) throw Error(`can't find file for ${id[0]} ${id[1]}`)
    this.audio.src = episode.file

    this.select('.title').forEach(el => (el.innerText = episode.title))

    this.setProgressAttr('playing', false)
    this.setProgressAttr('current', 0)

    if ((await store.getX('player.status')) !== 'paused')
      await this.audio.play()
  }

  private async getEpisode(id: EpisodeId) {
    id ??= await store.getX('player.current')
    if (!id) throw Error(`can't get src (no episode playing)`)
    return await store.getX('episodes.*.*', ...id)
  }

  // private async getSrc(id?: EpisodeId) {
  //   id ??= await store.getX('player.current')
  //   if (!id) throw Error(`can't get src (no episode playing)`)
  //   const episode = await store.getX('episodes.*.*', ...id)
  //   if (!episode?.file) throw Error(`can't find file for ${id[0]} ${id[1]}`)
  //   return episode.file
  // }

  // onDurationChange(duration: number) {
  //   // if (this.currentId) main.setEpisodeDuration(this.currentId[1], duration)
  //   // this.setProgressAttr('duration', duration)
  //   // this.events.call('duration', duration, this.currentId)
  // }

  onBufferedChange() {
    // const buffered = this.audioService.buffered
    const buffered = this.audio.buffered
    logger.info({ buffered })
    for (const bar of this.progressBars) {
      bar.buffered = buffered
      bar.scheduleFrame()
    }
  }

  async onEnded() {
    // this.current = null
    // this.audioService.setSrc(null)
    // await this.syncProgress()
  }

  private onBarJump(e: CustomEvent<number>) {
    this.jump((e as CustomEvent<number>).detail)
  }

  // utils

  private waitForSrc = (src: string | null) =>
    new Promise<void>(res => {
      if (this.audio.src === src) return res()
      const onChange = ({ detail }: CustomEvent<string | null>) => {
        if (detail !== src) return
        this.audio.removeEventListener('src', onChange as any)
        res()
      }
      this.audio.addEventListener('src', onChange)
    })

  private progressBars = this.getProgressBars()

  private getProgressBars() {
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
    for (const bar of addedBars) {
      bar.addEventListener('jump', this.onBarJump as any)
      // bar.setAttribute('current', this.audioService.time)
      this.progressBars.push(bar)
    }
    for (const bar of removedBars) {
      bar.removeEventListener('jump', this.onBarJump as any)
      this.progressBars = this.progressBars.filter(v => v !== bar)
    }
  })

  private setProgressAttr(name: string, value: string | number | boolean) {
    for (const bar of this.progressBars) {
      bar.setAttribute(name, value.toString())
    }
  }

  private select<T extends HTMLElement>(selector: string): T[] {
    return Array.from(this.shadowRoot!.querySelectorAll<T>(selector))
  }

  @logger.time
  private async getSrc(id?: EpisodeId) {
    id ??= await store.getX('player.current')
    if (!id) throw Error(`can't get src (no episode playing)`)
    const episode = await store.getX('episodes.*.*', ...id)
    if (!episode?.file)
      throw Error(`can't get src (no episode ${id[0]} ${id[1]})`)
    return episode.file
  }
}
