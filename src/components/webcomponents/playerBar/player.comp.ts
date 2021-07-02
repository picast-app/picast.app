import content from './template.html'
import Component from '../base.comp'
import type Progress from 'components/webcomponents/progressBar/progress.comp'
import type Audio from 'components/webcomponents/audio.comp'
import MediaSession from './components/mediaSession'
import Interaction from './components/interaction'
import EventDispatcher from './components/events'
import StateListener from './components/stateListener'
import store from 'store/uiThread/api'
import { bindThis } from 'utils/proto'
import { PlayState } from 'utils/audioState'
import { timeLimit } from 'utils/promise'

export default class Player extends Component {
  static tagName = 'picast-player'
  static template = Player.createTemplate(content)

  private mediaSession = new MediaSession(this)
  private interaction = new Interaction(this)
  private stateListener = new StateListener(this)
  private events = new EventDispatcher()
  private audio = this.shadowRoot!.querySelector<Audio>('picast-audio')!

  // private _current: CurrentPlayback = null

  constructor() {
    super()
    bindThis(this)
    // state('playing.id', this.onStateChange)

    this.audio.addEventListener('state', ({ detail }) =>
      this.onAudioStateChange(detail)
    )
  }

  connectedCallback() {
    this.interaction.enable()
    this.mediaSession.enable()
    this.stateListener.enable()

    // this.audioService.volume = 0.4
    window.addEventListener('pagehide', this.forcedSync)
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

    window.removeEventListener('pagehide', this.forcedSync)
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

  // private async onStateChange(id: EpisodeId) {
  //   if (id?.[1] === this.current?.[1].id) return
  //   const [podcast, episode] = await this.getInfo(id)
  //   if (!podcast || !episode) throw Error("couldn't read current info")
  //   this.setCurrent([podcast, episode])
  // }

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

  public setProgressAttr(name: string, value: string | number | boolean) {
    for (const bar of this.progressBars) {
      bar.setAttribute(name, value.toString())
    }
  }

  public addEventListener = this.events.addEventListener.bind(this.events)
  public removeEventListener = this.events.removeEventListener.bind(this.events)

  // public pause = this.audioService.pause
  // public resume = this.audioService.resume
  // public isPlaying = this.audioService.isPlaying
  // public get time() {
  //   return this.audioService.time
  // }
  // public get duration() {
  //   return this.audioService.duration
  // }

  // public async play(id: EpisodeId) {
  //   const [podcast, episode] = await this.getInfo(id)
  //   if (!episode?.file)
  //     throw Error(`can't find src for episode ${id.join('-')}`)
  //   await this.setCurrent([podcast!, episode], this.audioService.play)
  //   await main.setPlaying(id)
  // }

  // private async setCurrent(
  //   [podcast, episode]: [Podcast, EpisodeMin],
  //   set: (src: string, pos?: number) => any = this.audioService.setSrc
  // ) {
  //   this.current = [podcast, episode]
  //   await set(episode.file, episode.currentTime)
  //   this.setProgressAttr('current', episode.currentTime ?? 0)
  //   this.events.call('current', [podcast, episode])
  //   this.events.call('jump', episode.currentTime ?? 0, this.currentId)
  // }

  // public get current(): CurrentPlayback {
  //   return this._current
  // }

  // public set current(current: CurrentPlayback) {
  //   if (
  //     (!current && !this._current) ||
  //     (current &&
  //       this._current &&
  //       current.every(({ id }, i) => this._current![i].id === id))
  //   )
  //     return
  //   this._current = current
  //   if (!current) {
  //     this.setAttribute('hidden', '')
  //     return
  //   }
  //   this.removeAttribute('hidden')
  //   for (const title of this.select('.title'))
  //     title.textContent = current[1].title
  //   this.mediaSession.showInfo()
  // }

  // public get currentId(): EpisodeId | undefined {
  //   return this._current
  //     ? [this._current[0].id, this._current[1].id]
  //     : undefined
  // }

  public jump(pos: number, relative = false) {
    // if (relative) pos = this.audioService.time + pos
    // this.audioService.time = pos
    // logger.info('jump to', pos)
    // this.setProgressAttr('current', pos)
    // this.events.call('jump', pos, this.currentId)
    // this.syncProgress()
  }

  private syncId?: number

  public async syncProgress() {
    // if (this.syncId) {
    //   clearTimeout(this.syncId)
    //   delete this.syncId
    // }
    // if (!this.current) {
    //   // await main.playbackCompleted()
    // } else {
    //   const { src, time } = this.audioService ?? {}
    //   if (this.current?.[1].file !== src) throw Error('episode mismatch')
    //   // if (time) await main.setProgress(time)
    //   if (this.isPlaying())
    //     this.syncId = window.setTimeout(this.syncProgress, 5000)
    // }
  }

  private async forcedSync() {
    // const time = this.audioService?.time
    // if (time !== undefined) await main.setProgress(time, true)
    // else throw Error("couldn't force sync (unknown time)")
  }

  // private select<T extends HTMLElement>(selector: string): T[] {
  //   return Array.from(this.shadowRoot!.querySelectorAll<T>(selector))
  // }

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
    }
    for (const bar of removedBars)
      bar.removeEventListener('jump', this.onBarJump as any)
  })

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
    if (state === 'paused') return
    store.setX('player.status', state)
  }

  async onEpisodeChange(id: EpisodeId | null) {
    if (!id) return (this.audio.src = null)

    this.audio.pause()
    this.audio.src = await this.getSrc(id)

    if ((await store.getX('player.status')) !== 'paused')
      await this.audio.play()
  }

  private async getSrc(id?: EpisodeId) {
    id ??= await store.getX('player.current')
    if (!id) throw Error(`can't get src (no episode playing)`)
    const episode = await store.getX('episodes.*.*', ...id)
    if (!episode?.file) throw Error(`can't find file for ${id[0]} ${id[1]}`)
    return episode.file
  }

  onDurationChange(duration: number) {
    // if (this.currentId) main.setEpisodeDuration(this.currentId[1], duration)
    // this.setProgressAttr('duration', duration)
    // this.events.call('duration', duration, this.currentId)
  }

  onBufferedChange() {
    // const buffered = this.audioService.buffered
    // for (const bar of this.progressBars) {
    //   bar.buffered = buffered
    //   bar.scheduleFrame()
    // }
  }

  async onEnded() {
    // this.current = null
    // this.audioService.setSrc(null)
    // await this.syncProgress()
  }

  private onBarJump(e: CustomEvent<number>) {
    this.jump((e as CustomEvent<number>).detail)
  }

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
}
