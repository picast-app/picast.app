import * as debug from './debug'

const DEBUG = true

export default class TouchRegistry {
  constructor() {
    this.onTouchStart = this.onTouchStart.bind(this)
    this.onTouchMove = this.onTouchMove.bind(this)
    this.onTouchEnd = this.onTouchEnd.bind(this)
    window.addEventListener('touchstart', this.onTouchStart)
    window.addEventListener('touchmove', this.onTouchMove)
    window.addEventListener('touchend', this.onTouchEnd)

    if (DEBUG) debug.createCanvas()
    this.render = DEBUG ? () => debug.render(this) : this.render.bind(this)
  }

  public readonly active: Record<
    number,
    { path: [x: number, y: number][] }
  > = {}

  private onTouchStart(e: TouchEvent) {
    for (const touch of e.touches) {
      this.active[touch.identifier] = { path: [[touch.pageX, touch.pageY]] }
    }
    this.render()
  }

  private onTouchMove(e: TouchEvent) {
    for (const touch of e.touches) {
      this.active[touch.identifier].path.push([touch.pageX, touch.pageY])
    }
    this.render()
  }

  private onTouchEnd(e: TouchEvent) {
    const ids = Array.from(e.touches).map(v => v.identifier)
    for (const id of Object.keys(this.active)) {
      if (!ids.includes(parseInt(id))) delete this.active[id as any]
    }
    this.render()
  }

  private render() {}
}
new TouchRegistry()
