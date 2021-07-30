import content from './template.html'
import Component from '../base.comp'
import { debounce } from 'utils/function'
import { durAttr, formatDuration } from 'utils/time'
import { desktop } from 'styles/responsive'
import { bindThis } from 'utils/proto'
import * as cl from 'utils/css/color'
import { clamp } from 'utils/math'
import { easeOutSine, easeInOutCubic } from 'utils/ease'
import { DelayMachine } from 'utils/state'

export default class Progress extends Component {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly tsCurrent: HTMLTimeElement
  private readonly tsRemains: HTMLTimeElement
  private isInline: boolean
  private isDesktop: boolean
  private current?: number
  private playing = false
  private playStart?: number
  private loading = this.makeLoadState()
  private loadStart?: number
  private loadToggle?: number
  private dragX?: number
  private dragging = false
  private bcr?: DOMRect
  private duration?: number
  private theme?: 'light' | 'dark'
  public buffered: [start: number, end: number][] = []

  static tagName = 'player-progress'
  static template = Progress.createTemplate(content)

  private static clBar = '#444'
  private static clBuffered = '#888'
  private static clProgress = '#ff0'
  private static clKnob = '#fff'
  private static clDragKnob = '#fff4'

  private get inline() {
    return this.isInline && !this.isDesktop
  }

  private static BAR_HEIGHT = 1 / 3

  private get progress(): number {
    return (this.current ?? 0) / this.duration!
  }
  private get compProgress(): number {
    return (
      (this.progress * this.duration! +
        (performance.now() - this.playStart!) / 1000) /
      this.duration!
    )
  }
  private get remaining(): number {
    return this.duration! - (this.current ?? 0)
  }

  private readonly resizeObserver = new ResizeObserver(
    debounce(this.resize.bind(this), 100)
  )

  constructor() {
    super()
    this.canvas = this.shadowRoot!.querySelector('canvas')!
    this.ctx = this.canvas.getContext('2d')!
    bindThis(this)

    this.tsCurrent = this.shadowRoot!.getElementById('current') as any
    this.tsRemains = this.shadowRoot!.getElementById('remaining') as any

    const q = window.matchMedia(desktop)
    this.isDesktop = q.matches
    q.onchange = v => {
      this.isDesktop = v.matches
    }
    this.isInline = this.hasAttribute('inline')
    this.setColors(this.getAttribute('theme') as any)
  }

  connectedCallback() {
    this.resizeObserver.observe(this.canvas)
    this.canvas.addEventListener('pointerdown', this.onDragStart)
    this.scheduleFrame()
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    this.addEventListener('touchstart', this.onTouchStart)
  }

  disconnectedCallback() {
    this.resizeObserver.disconnect()
    this.canvas.removeEventListener('pointerdown', this.onDragStart)
    window.removeEventListener('pointermove', this.onDrag)
    window.removeEventListener('pointerup', this.onDragStop)
    window.removeEventListener('keydown', this.onDragCancel)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.removeEventListener('touchstart', this.onTouchStart)
  }

  static get observedAttributes() {
    return ['duration', 'current', 'playing', 'theme', 'loading']
  }

  attributeChangedCallback(name: string, old: string, current: string) {
    if (old === current) return
    switch (name) {
      case 'current':
        this.current = parseFloat(current)
        this.labelProg = this.current
        this.playStart = performance.now()
        break
      case 'duration':
        this.duration = parseFloat(current)
        this.labelRemains = this.remaining
        break
      case 'playing':
        this.playing = current === 'true'
        if (this.playing) this.playStart = performance.now()
        else this.current = this.compProgress * this.duration!
        break
      case 'loading':
        this.loading.transition(/true/i.test(current))
        break
      case 'theme':
        this.setColors(current as any)
        break
    }
    this.scheduleFrame()
  }

  private setColors(theme: 'light' | 'dark') {
    if (theme === this.theme) return
    this.theme = theme
    logger.info('progress bar theme', theme)

    const primary = cl.read('primary')
    const back = cl.read('surface-alt')
    const text = cl.read('text-alt')

    Progress.clProgress = cl.format.hex(primary)
    Progress.clBar = cl.format.hex(cl.blend(back, cl.alpha(text, 0x44)))
    Progress.clBuffered = cl.format.hex(cl.blend(back, cl.alpha(text, 0x88)))
  }

  private resize([{ contentRect: box }]: readonly ResizeObserverEntry[]) {
    this.canvas.width = box.width * devicePixelRatio
    this.canvas.height = box.height * devicePixelRatio
    this.scheduleFrame()
  }

  private afId?: number
  public scheduleFrame() {
    if (this.afId && document.visibilityState !== 'visible') return
    this.afId = requestAnimationFrame(this.render)
  }

  private onVisibilityChange() {
    delete this.afId
    if (document.visibilityState === 'visible') {
      this.scheduleFrame()
      logger.info('resume progress bar render')
    } else logger.info('suspend progress bar render')
  }

  private render() {
    delete this.afId
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    let progress =
      this.dragX !== undefined
        ? this.dragProgress
        : !this.playing
        ? this.progress
        : this.compProgress

    progress = clamp(0, progress, 1)

    this.labelProg = progress * (this.duration! | 0)
    this.labelRemains = (this.duration! | 0) * (1 - progress)

    if (this.inline) this.renderInline(progress)
    else this.renderFull(progress)

    if (!this.playing && !this.loadToggle && this.dragX === undefined) return
    this.afId = requestAnimationFrame(this.render)
  }

  private renderFull(progress: number) {
    let height = this.canvas.height * Progress.BAR_HEIGHT
    let knobRadius = this.canvas.height / 2

    if (!this.isDesktop) {
      height /= 2
      knobRadius /= 2
    }

    const padd = knobRadius - height / 2
    const width = this.canvas.width - padd * 2
    const knobX = padd + height / 2 + (width - height) * progress

    let loadTrans = this.loadToggle
      ? Math.min((performance.now() - this.loadToggle!) / 500, 1)
      : 1
    if (!this.loading.current) loadTrans = 1 - loadTrans
    if (loadTrans > 0 && loadTrans < 1) loadTrans = easeInOutCubic(loadTrans)
    if (!this.loading.current && loadTrans === 0) delete this.loadToggle

    if (loadTrans < 1) {
      this.ctx.globalAlpha = 1 - loadTrans
      // background bar
      this.ctx.fillStyle = Progress.clBar
      this.drawBar(padd, padd + width, height)

      // buffer bars
      if (this.duration) {
        this.ctx.fillStyle = Progress.clBuffered
        for (const [start, end] of this.buffered)
          this.drawBar(padd + start * width, padd + end * width, height)
      }
    }

    // loading indicator
    if (loadTrans > 0) {
      this.ctx.globalAlpha = loadTrans
      this.renderLoading(padd, width, height, knobX)
    }

    this.ctx.globalAlpha = 1

    if (!this.duration) return

    // progress bar
    this.ctx.fillStyle = Progress.clProgress
    this.drawBar(padd, knobX, height)

    // progress knob
    if (this.dragging)
      this.drawKnob(knobX, this.canvas.height / 2, Progress.clDragKnob)
    this.drawKnob(knobX, knobRadius)
  }

  private renderInline(progress: number) {
    const height = this.canvas.height
    this.ctx.fillStyle = Progress.clBar
    // background bar
    this.drawBar(0, this.canvas.width, height, false, false)
    if (!this.duration) return
    // progress bar
    this.ctx.fillStyle = Progress.clProgress
    // progress knob
    this.drawBar(0, progress * this.canvas.width, height, false, true)
  }

  private renderLoading(
    padd: number,
    width: number,
    height: number,
    knobX: number
  ) {
    const spacing = 3
    const rad = height / 3

    const velRadPerSec = 10
    const step = rad * 2 * (1 + spacing)
    const offset =
      (((performance.now() - this.loadStart!) / 1000) * (velRadPerSec * rad)) %
      step

    const bMax = padd + width - rad
    const bMin = Math.max(padd + rad, knobX)

    const alphaBase = this.ctx.globalAlpha

    for (let x = 0 - offset; x < width; x += step) {
      const cx = x + padd + rad
      if (cx < bMin || cx > bMax) continue
      let r = rad
      let alpha = (bMax - cx) / step
      if (alpha < 1) {
        alpha = easeOutSine(alpha)
        this.ctx.globalAlpha = alphaBase * alpha
        r *= alpha
      }
      this.drawKnob(cx, r, Progress.clBuffered)
    }
  }

  private drawBar(
    start: number,
    end: number,
    height: number,
    roundLeft = true,
    roundRight = true
  ) {
    if (roundLeft) {
      this.ctx.beginPath()
      this.ctx.arc(
        start + height / 2,
        this.canvas.height / 2,
        height / 2,
        Math.PI * 0.5,
        Math.PI * 1.5
      )
      this.ctx.fill()
    }

    let left = start
    let right = end
    if (roundLeft) left += height / 2
    if (roundRight) right -= height / 2
    if (right < left) return
    this.ctx.fillRect(
      left,
      this.canvas.height / 2 - height / 2,
      right - left,
      height
    )
    if (roundRight) {
      this.ctx.beginPath()
      this.ctx.arc(
        end - height / 2,
        this.canvas.height / 2,
        height / 2,
        Math.PI * 1.5,
        Math.PI * 0.5
      )
      this.ctx.fill()
    }
  }

  private drawKnob(
    x: number,
    rad = this.canvas.height / 2,
    color = Progress.clKnob
  ) {
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.arc(x, this.canvas.height / 2, rad, 0, Math.PI * 2)
    this.ctx.fill()
  }

  private onTouchStart(e: TouchEvent) {
    e.stopPropagation()
  }

  private onDragStart(e: MouseEvent) {
    if (!this.duration || !isFinite(this.duration)) return

    const fsWrap = this.closest<HTMLElement>('.fs-sec-wrap')
    if (fsWrap) {
      fsWrap.style.touchAction = 'none'
      fsWrap.style.overflowX = 'hidden'
    }

    this.dragging = true
    document.documentElement.style.userSelect = 'none'
    document.documentElement.style.cursor = 'grabbing'
    this.canvas.style.cursor = 'inherit'
    window.addEventListener('pointermove', this.onDrag)
    window.addEventListener('pointerup', this.onDragStop)
    window.addEventListener('keydown', this.onDragCancel)
    this.bcr = this.getBoundingClientRect()
    this.dragX = e.pageX
    this.scheduleFrame()
  }

  private onDrag(e: MouseEvent) {
    this.dragX = e.pageX
  }

  private onDragStop() {
    this.dragging = false
    const progress = this.dragProgress * this.duration!
    this.onDragCancel()
    this.setAttribute('current', progress as any)
    this.dispatchEvent(new CustomEvent('jump', { detail: progress }))

    const fsWrap = this.closest<HTMLElement>('.fs-sec-wrap')
    if (fsWrap) {
      fsWrap.style.touchAction = 'initial'
      fsWrap.style.overflowX = 'scroll'
    }
  }

  private onDragCancel(e?: KeyboardEvent) {
    if (e && e?.key !== 'Escape') return
    document.documentElement.style.userSelect = ''
    document.documentElement.style.cursor = ''
    this.canvas.style.cursor = ''
    window.removeEventListener('pointermove', this.onDrag)
    window.removeEventListener('pointerup', this.onDragStop)
    window.removeEventListener('keydown', this.onDragCancel)
    delete this.dragX
  }

  get dragProgress(): number {
    const padd = this.inline ? 0 : this.canvas.height / 2 / devicePixelRatio
    const width = this.canvas.width / devicePixelRatio - padd * 2
    return (
      (clamp(padd, (this.dragX ?? 0) - this.bcr!.left, width + padd) - padd) /
      width
    )
  }

  private _labelProg?: number
  private set labelProg(n: number) {
    n |= 0
    if (n === this._labelProg) return
    this._labelProg = n
    this.tsCurrent.textContent = formatDuration(n)
    this.tsCurrent.setAttribute('datetime', durAttr(n))
  }

  private _labelRemains?: number
  private set labelRemains(n: number) {
    n |= 0
    if (n === this._labelRemains) return
    this._labelRemains = n
    this.tsRemains.textContent = formatDuration(n)
    this.tsRemains.setAttribute('datetime', durAttr(n))
  }

  private makeLoadState() {
    const state = new DelayMachine<boolean>(false)
    state.addTransition(false, true, 100)
    state.addTransition(true, false)

    state.onChange(loading => {
      this.loadToggle = performance.now()
      if (!loading) return
      this.loadStart = this.loadToggle
      this.scheduleFrame()
    })

    return state
  }
}
