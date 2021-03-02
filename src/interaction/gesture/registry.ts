import * as debug from './debug'
import { main, proxy } from 'workers'

main.state(
  'debug.touch',
  proxy(v => {
    if (v) {
      debug.createCanvas()
      TouchRegistry.render = debug.render
    } else {
      debug.cleanup()
      delete TouchRegistry.render
    }
  })
)

export default class TouchRegistry {
  constructor() {
    this.onTouchStart = this.onTouchStart.bind(this)
    this.onTouchMove = this.onTouchMove.bind(this)
    this.onTouchEnd = this.onTouchEnd.bind(this)
    window.addEventListener('touchstart', this.onTouchStart)
    window.addEventListener('touchmove', this.onTouchMove)
    window.addEventListener('touchend', this.onTouchEnd)
  }

  public readonly active: Record<
    number,
    { path: [x: number, y: number][] }
  > = {}

  private onTouchStart(e: TouchEvent) {
    for (const touch of e.touches) {
      this.active[touch.identifier] = { path: [[touch.pageX, touch.pageY]] }
    }
    TouchRegistry.render?.(this)
  }

  private onTouchMove(e: TouchEvent) {
    for (const touch of e.touches) {
      this.active[touch.identifier].path.push([touch.pageX, touch.pageY])
    }
    TouchRegistry.render?.(this)
  }

  private onTouchEnd(e: TouchEvent) {
    const ids = Array.from(e.touches).map(v => v.identifier)
    for (const id of Object.keys(this.active)) {
      if (!ids.includes(parseInt(id))) delete this.active[id as any]
    }
    TouchRegistry.render?.(this)
  }

  public static render?: (registry: TouchRegistry) => void

  // private render() {}
}
new TouchRegistry()
