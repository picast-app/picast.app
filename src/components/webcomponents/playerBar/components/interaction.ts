import Service from './base'
import { desktop } from 'styles/responsive'
import { animateTo } from 'utils/animate'
import { clamp } from 'utils/math'
import { history, SearchParams, location } from '@picast-app/router'
import {
  GestureController,
  VerticalSwipe,
  UpwardSwipe,
  ExclusiveDownwardSwipe,
} from 'interaction/gesture/gestures'

enum FsState {
  CLOSED,
  EXTENDED,
}

export default class Interaction extends Service {
  private touchBoxes: HTMLElement[] = []
  private isDesktop?: boolean
  private isInfo?: boolean
  private isFullscreen = false
  private mainnav?: HTMLElement
  private fullscreen?: HTMLElement
  private gesture?: GestureController<UpwardSwipe | ExclusiveDownwardSwipe>
  private playerHeight: number = 4 * 16

  enable() {
    this.playerHeight = this.player.offsetHeight
    this.mainnav = document.getElementById('mainnav')!
    this.fullscreen =
      this.player.shadowRoot!.querySelector<HTMLElement>('.fullscreen')!

    const container = (
      this.player.shadowRoot!.getElementById('touchbox') as HTMLTemplateElement
    ).content
    this.touchBoxes.push(container.getElementById('closed')!)
    this.touchBoxes.push(container.getElementById('extended')!)

    this.isFullscreen = !this.isDesktop && this.isFullscreenUrl

    const q = window.matchMedia(desktop)
    this.isDesktop = q.matches
    q.onchange = v => {
      this.isDesktop = v.matches
      if (this.isDesktop) {
        this.removeFsListeners()
        this.fsTransform(0)
      } else this.addFsListeners()
    }

    this.isInfo = this.isInfoUrl

    if (!this.isDesktop && !this.isInfo) this.addFsListeners()
    if (!this.isDesktop) this.fsTransform(+this.isFullscreen)

    this.player.shadowRoot
      ?.querySelectorAll('.title')
      .forEach(title => title.addEventListener('click', this.showEpisodeInfo))

    this.startListenHistory()
  }

  disable() {
    this.removeFsListeners()
    this.stopListenHistory()
  }

  private _historyUnsub?: () => void
  private startListenHistory() {
    this.stopListenHistory()
    this._historyUnsub = history.listen(() => {
      if (this.isDesktop) return
      if (this.isFullscreen === this.isFullscreenUrl) {
        if (this.isInfoUrl !== this.isInfo) {
          this.isInfo = this.isInfoUrl
          if (this.isInfo) this.removeFsListeners()
          else this.addFsListeners()
        }
        return
      }
      this.stopListenHistory()
      setTimeout(this.startListenHistory, 100)
      this.isFullscreen = !this.isFullscreen
      this.fsTransform(+this.isFullscreen, true)
      this.attachGesture()
    })
  }
  private stopListenHistory() {
    this._historyUnsub?.()
    delete this._historyUnsub
  }

  private addFsListeners() {
    this.player.shadowRoot!.addEventListener('click', this.onPlayerClick as any)
    this.attachGesture()
  }

  private removeFsListeners() {
    this.player.shadowRoot!.removeEventListener(
      'click',
      this.onPlayerClick as any
    )
    this.detachGesture()
  }

  private attachGesture() {
    this.detachGesture()
    this.gesture = new GestureController(
      this.isFullscreen ? ExclusiveDownwardSwipe : UpwardSwipe,
      this.touchBox()
    )
    this.gesture.start()
    this.gesture.addEventListener('start', this.onSwipe)
  }

  private detachGesture() {
    this.gesture?.removeEventListener('start', this.onSwipe)
    this.gesture?.stop()
    delete this.gesture
  }

  private onSwipe(swipe: VerticalSwipe) {
    this.gesture?.removeEventListener('start', this.onSwipe)

    swipe.addEventListener('move', this.setFsPos)
    swipe.addEventListener('end', cancelled => {
      this.gesture?.addEventListener('start', this.onSwipe)
      let frac = swipe.lastY / (window.innerHeight - this.playerHeight)
      if (frac < 0) frac += 1
      if (cancelled || frac === 0) return
      const vel = Math.abs(swipe.velocity) < 3 ? 0 : swipe.velocity
      this.fsTransform(+(Math.abs(vel) ? vel < 0 : frac > 0.5), true)
    })
  }

  private setFsPos(y: number) {
    const height = window.innerHeight - this.playerHeight
    if (y <= 0 && this.isFullscreen) y = height + y
    const n = clamp(0, y / height, 1)
    y = n * height
    this.fsTransform({
      player: `calc(-${Math.round(y)}px + ${(n * 100) | 0}%)`,
      fullscreen: `calc(${-n} * var(--player-height))`,
      mainnav: `${Math.min(y, this.playerHeight)}px`,
    })
  }

  private fsTransform(
    targets: Partial<typeof fsTransforms[0]> | FsState,
    opts?: KeyframeAnimationOptions | true
  ) {
    const states = typeof targets === 'number' ? fsTransforms[targets] : targets
    const anim = opts === true ? { duration: 350, easing: 'ease' } : opts

    for (const el of ['player', 'mainnav', 'fullscreen'] as const) {
      if (!(el in states)) continue
      const transform = `translateY(${states[el]})`
      if (anim) animateTo(this[el]!, { transform }, anim)
      else this[el]!.style.transform = transform
    }
    if (!anim || typeof targets !== 'number' || +this.isFullscreen === targets)
      return

    this.isFullscreen = targets === 1
    history.push({ hash: targets ? 'playing' : '' })
    this.attachGesture()
  }

  private showEpisodeInfo() {
    // if (!this.player.current) return
    // const [{ id: pod }, { id: ep }] = this.player.current
    // history.push({
    //   search: SearchParams.merge({ info: `${pod}-${ep}` }, location.search),
    // })
  }

  private onPlayerClick(e: PointerEvent) {
    if (e.target === this.player || (e.target as any).slot === 'info')
      this.fsTransform(FsState.EXTENDED, true)
  }

  private get isFullscreenUrl() {
    return /^#?notes|playing|queue$/.test(location.hash)
  }

  private get isInfoUrl() {
    return 'info' in new SearchParams(location.search).content
  }

  private touchBox(fs: FsState = +this.isFullscreen) {
    return this.touchBoxes[fs]
  }
}

const fsTransforms = [
  {
    player: '0',
    fullscreen: '0',
    mainnav: '0',
  },
  {
    player: 'calc((100vh - var(--bar-height) - var(--player-height)) * -1)',
    fullscreen: 'calc(-1 * var(--player-height))',
    mainnav: '100%',
  },
]
