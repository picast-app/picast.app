import html from './progress.html'
import debounce from 'lodash/debounce'
import { durAttr, formatDuration } from 'utils/time'

const tmpl = document.createElement('template')
tmpl.innerHTML = html

export default class Progress extends HTMLElement {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private duration?: number
  private current?: number
  private playing = false
  private playStart?: number
  private dragX?: number
  private bcr?: DOMRect

  private static BAR_HEIGHT = 1 / 3

  private get progress(): number {
    return (this.current ?? 0) / (this.duration ?? 600)
  }
  private get remaining(): number {
    return (this.duration ?? 600) - (this.current ?? 0)
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
  }

  connectedCallback() {
    this.resizeObserver.observe(this.canvas)
    this.addEventListener('mousedown', this.onDragStart)
  }

  disconnectedCallback() {
    this.resizeObserver.disconnect()
    this.removeEventListener('mousedown', this.onDragStart)
    window.removeEventListener('mousemove', this.onDrag)
    window.removeEventListener('mouseup', this.onDragStop)
    window.removeEventListener('keydown', this.onDragCancel)
  }

  static get observedAttributes() {
    return ['duration', 'current', 'playing']
  }

  attributeChangedCallback(name: string, old: string, current: string) {
    if (name === 'current' || name === 'duration') {
      this[name] = parseFloat(current)
      logger.info(name, this[name])
      const node = this.shadowRoot!.getElementById(
        name === 'current' ? name : 'remaining'
      )!
      const time = name === 'current' ? this.progress : this.remaining
      node.textContent = formatDuration(time)
      node.setAttribute('datetime', durAttr(time))
      this.scheduleFrame()
    } else if (name === 'playing') {
      this.playing = current === 'true'
      if (this.playing) {
        this.playStart = performance.now()
        this.scheduleFrame()
      }
    }
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
    this.ctx.fillStyle = '#888'

    const height = this.canvas.height * Progress.BAR_HEIGHT
    const padd = (this.canvas.height - height) / 2
    const width = this.canvas.width - padd * 2 - height

    let knobX: number

    if (this.dragX === undefined) {
      const currentProg = !this.playing
        ? this.progress
        : (this.progress * this.duration! +
            (performance.now() - this.playStart!) / 1000) /
          this.duration!

      knobX = padd + height / 2 + width * currentProg
    } else {
      knobX = Math.min(
        Math.max(
          (this.dragX - this.bcr!.left) * devicePixelRatio,
          padd + height / 2
        ),
        this.canvas.width - padd - height / 2
      )
    }

    this.drawBar(padd, this.canvas.width - padd, height)
    this.ctx.fillStyle = '#ff08'
    this.drawBar(padd, knobX, height)
    this.drawKnob(knobX)

    if (!this.playing && this.dragX === undefined) return
    this.afId = requestAnimationFrame(this.render)
  }

  private drawBar(start: number, end: number, height: number) {
    this.ctx.beginPath()
    this.ctx.arc(
      start + height / 2,
      this.canvas.height / 2,
      height / 2,
      Math.PI * 0.5,
      Math.PI * 1.5
    )
    this.ctx.fill()
    this.ctx.fillRect(
      start + height / 2,
      this.canvas.height / 2 - height / 2,
      end - start - height,
      height
    )
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
    window.addEventListener('mousemove', this.onDrag)
    window.addEventListener('mouseup', this.onDragStop)
    window.addEventListener('keydown', this.onDragCancel)
    this.bcr = this.getBoundingClientRect()
    this.dragX = e.screenX
    this.scheduleFrame()
  }

  private onDrag(e: MouseEvent) {
    this.dragX = e.screenX
  }

  private onDragStop({ screenX: x }: MouseEvent) {
    this.onDragCancel()

    const padd = this.canvas.height / 2 / devicePixelRatio
    const width = this.canvas.width / devicePixelRatio - padd * 2
    const normalX =
      (Math.min(Math.max(x - this.bcr!.left, padd), width + padd) - padd) /
      width
    const progress = normalX * (this.duration ?? 600)

    logger.info('jump to', progress | 0)
    this.dispatchEvent(new CustomEvent('jump', { detail: progress }))
    this.current = progress
    this.playStart = performance.now()
  }

  private onDragCancel(e?: KeyboardEvent) {
    if (e && e?.key !== 'Escape') return
    document.documentElement.style.userSelect = ''
    document.documentElement.style.cursor = ''
    this.canvas.style.cursor = ''
    window.removeEventListener('mousemove', this.onDrag)
    window.removeEventListener('mouseup', this.onDragStop)
    window.removeEventListener('keydown', this.onDragCancel)
    delete this.dragX
  }
}

customElements.define('player-progress', Progress)
