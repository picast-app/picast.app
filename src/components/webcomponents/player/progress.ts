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
  }

  connectedCallback() {
    this.resizeObserver.observe(this.canvas)
  }

  disconnectedCallback() {
    this.resizeObserver.disconnect()
  }

  static get observedAttributes() {
    return ['duration', 'current']
  }

  attributeChangedCallback(name: string, old: string, current: string) {
    // switch (name) {
    //   case 'current':
    //   case 'duration':
    //     this[name] = parseFloat(current)
    //     break
    // }
    if (name !== 'current' && name !== 'duration') return
    this[name] = parseFloat(current)
    logger.info(name, this[name])
    const node = this.shadowRoot!.getElementById(
      name === 'current' ? name : 'remaining'
    )!
    const time = name === 'current' ? this.progress : this.remaining
    node.textContent = formatDuration(time)
    node.setAttribute('datetime', durAttr(time))
    // if (name === 'current') {
    //   this.current = parseFloat(current)
    //   this.shadowRoot!.getElementById('current')
    // }
    // if (name === 'duration') {
    //   this.duration = parseFloat(current)
    // }
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

    const height = this.canvas.height / 2
    const padd = (this.canvas.height - height) / 2

    this.drawBar(padd, this.canvas.width - padd)
    const width = this.canvas.width - padd * 2 - this.canvas.height / 2
    this.drawKnob(padd + this.canvas.height / 4 + width * this.progress)
  }

  private drawBar(start: number, end: number, height = this.canvas.height / 2) {
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
}

customElements.define('player-progress', Progress)
