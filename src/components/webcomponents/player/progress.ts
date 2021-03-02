import html from './progress.html'
import debounce from 'lodash/debounce'
import { durAttr, formatDuration } from 'utils/time'
import { desktop } from 'styles/responsive'

const tmpl = document.createElement('template')
tmpl.innerHTML = html

export default class Progress extends HTMLElement {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly tsCurrent: HTMLTimeElement
  private readonly tsRemains: HTMLTimeElement
  private isInline: boolean
  private isDesktop: boolean
  private current?: number
  private playing = false
  private playStart?: number
  private dragX?: number
  private bcr?: DOMRect
  private _duration?: number

  private get duration() {
    return this._duration ?? 600
  }
  private set duration(n) {
    this._duration = n
  }
  private get inline() {
    return this.isInline && !this.isDesktop
  }

  private static BAR_HEIGHT = 1 / 3

  private get progress(): number {
    return (this.current ?? 0) / this.duration
  }
  private get remaining(): number {
    return this.duration - (this.current ?? 0)
  }

  private readonly resizeObserver = new ResizeObserver(
    debounce(this.resize.bind(this), 100, { leading: false, trailing: true })
  )

  constructor() {
    super()
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.appendChild(tmpl.content.cloneNode(true))

    this.canvas = this.shadowRoot!.querySelector('canvas')!
    this.ctx = this.canvas.getContext('2d')!
    this.render = this.render.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
    this.onDragStop = this.onDragStop.bind(this)
    this.onDrag = this.onDrag.bind(this)
    this.onDragCancel = this.onDragCancel.bind(this)

    this.tsCurrent = this.shadowRoot!.getElementById('current') as any
    this.tsRemains = this.shadowRoot!.getElementById('remaining') as any

    const q = window.matchMedia(desktop)
    this.isDesktop = q.matches
    q.onchange = v => {
      this.isDesktop = v.matches
    }
    this.isInline = this.hasAttribute('inline')
  }

  connectedCallback() {
    this.resizeObserver.observe(this.canvas)
    this.canvas.addEventListener('pointerdown', this.onDragStart)
  }

  disconnectedCallback() {
    this.resizeObserver.disconnect()
    this.canvas.removeEventListener('pointerdown', this.onDragStart)
    window.removeEventListener('pointermove', this.onDrag)
    window.removeEventListener('pointerup', this.onDragStop)
    window.removeEventListener('keydown', this.onDragCancel)
  }

  static get observedAttributes() {
    return ['duration', 'current', 'playing']
  }

  attributeChangedCallback(name: string, old: string, current: string) {
    switch (name) {
      case 'current':
        this.current = parseFloat(current)
        this.labelProg = this.current
        break
      case 'duration':
        this.duration = parseFloat(current)
        this.labelRemains = this.remaining
        break
      case 'playing':
        this.playing = current === 'true'
        if (this.playing) {
          this.playStart = performance.now()
          this.scheduleFrame()
        }
        break
    }
    this.scheduleFrame()
  }

  public jump(pos: number) {
    this.current = pos
    if (this.playing) this.playStart = performance.now()
    this.scheduleFrame()
  }

  private resize([{ contentRect: box }]: readonly ResizeObserverEntry[]) {
    this.canvas.width = box.width * devicePixelRatio
    this.canvas.height = box.height * devicePixelRatio
    this.scheduleFrame()
  }

  private afId?: number
  private scheduleFrame() {
    if (this.afId) return
    this.afId = requestAnimationFrame(this.render)
  }

  private render() {
    delete this.afId
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    const progress =
      this.dragX !== undefined
        ? this.dragProgress
        : !this.playing
        ? this.progress
        : (this.progress * this.duration! +
            (performance.now() - this.playStart!) / 1000) /
          this.duration!

    this.labelProg = progress * this.duration
    this.labelRemains = this.duration * (1 - progress)

    if (this.inline) this.renderInline(progress)
    else this.renderFull(progress)

    if (!this.playing && this.dragX === undefined) return
    this.afId = requestAnimationFrame(this.render)
  }

  private renderFull(progress: number) {
    this.ctx.fillStyle = '#888'

    const height = this.canvas.height * Progress.BAR_HEIGHT
    const padd = (this.canvas.height - height) / 2
    const width = this.canvas.width - padd * 2 - height

    const knobX = padd + height / 2 + width * progress

    this.drawBar(padd, this.canvas.width - padd, height)
    this.ctx.fillStyle = '#ff08'
    this.drawBar(padd, knobX, height)
    this.drawKnob(knobX)
  }

  private renderInline(progress: number) {
    const height = this.canvas.height
    this.ctx.fillStyle = '#888'
    this.drawBar(0, this.canvas.width, height, false, false)
    this.ctx.fillStyle = '#ff08'
    this.drawBar(0, progress * this.canvas.width, height, false, true)
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

  private drawKnob(x: number, rad = this.canvas.height / 2) {
    this.ctx.fillStyle = '#fff'
    this.ctx.beginPath()
    this.ctx.arc(x, this.canvas.height / 2, rad, 0, Math.PI * 2)
    this.ctx.fill()
  }

  private onDragStart(e: MouseEvent) {
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
    const progress = this.dragProgress * this.duration
    this.onDragCancel()
    this.dispatchEvent(new CustomEvent('jump', { detail: progress }))
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
      (Math.min(
        Math.max((this.dragX ?? 0) - this.bcr!.left, padd),
        width + padd
      ) -
        padd) /
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
}

customElements.define('player-progress', Progress)
