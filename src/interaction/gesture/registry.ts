import * as debug from './debug'
import { state } from 'workers'
import EventManager from 'utils/event'
import { bindThis } from 'utils/proto'

export default class TouchRegistry extends EventManager<{
  start: (e: TouchRegistryEvent) => void
}> {
  constructor() {
    super()
    bindThis(this)
    window.addEventListener('touchstart', this.onTouchStart)
  }

  public readonly active: Record<number, TouchRegistryEvent> = {}

  private onTouchStart(e: TouchEvent) {
    if (!this.listeners.start?.length) return
    const tn0 = Object.keys(this.active).length

    for (const touch of e.touches) {
      const event = TouchRegistryEvent.fromTouch(touch)
      this.call('start', event)
      if (event.claimed) this.active[event.id] = event
    }
    TouchRegistry.render?.(this)

    if (tn0 === 0 && Object.keys(this.active).length > 0) {
      window.addEventListener('touchmove', this.onTouchMove, { passive: true })
      window.addEventListener('touchend', this.onTouchEnd)
    }
  }

  private onTouchMove(e: TouchEvent) {
    for (const touch of e.touches) {
      if (touch.identifier in this.active)
        this.active[touch.identifier].move(touch.pageX, touch.pageY)
    }
    TouchRegistry.render?.(this)
  }

  private onTouchEnd(e: TouchEvent) {
    const tn0 = Object.keys(this.active).length
    const ids = Array.from(e.touches).map(v => v.identifier)
    for (const id of Object.keys(this.active)) {
      if (!ids.includes(parseInt(id))) {
        this.active[id as any].end()
        delete this.active[id as any]
      }
    }
    TouchRegistry.render?.(this)

    if (tn0 > 0 && Object.keys(this.active).length === 0) {
      window.removeEventListener('touchmove', this.onTouchMove)
      window.removeEventListener('touchend', this.onTouchEnd)
    }
  }

  public ignore(list: TouchList) {
    for (const touch of list) {
      if (touch.identifier in this.active) {
        if (touch.pageY > this.active[touch.identifier].y)
          this.active[touch.identifier].offY +=
            touch.pageY - this.active[touch.identifier].y
      }
    }
  }

  public static render?: (registry: TouchRegistry) => void
}

export class TouchRegistryEvent extends EventManager<
  {
    [K in 'move' | 'end']: (e: TouchRegistryEvent) => void
  }
> {
  public claimed = false
  public readonly path: [x: number, y: number][] = []
  public offY = 0

  constructor(public readonly id: number) {
    super()
  }

  public claim() {
    this.claimed = true
  }

  static fromTouch(touch: Touch): TouchRegistryEvent {
    const event = new TouchRegistryEvent(touch.identifier)
    event.path.push([touch.pageX, touch.pageY])
    return event
  }

  get x() {
    return this.path[0][0]
  }

  get y() {
    return this.path[0][1]
  }

  public move(x: number, y: number) {
    this.path.push([x, y - this.offY])
    this.call('move', this)
  }

  public end() {
    this.call('end', this)
  }
}

state<boolean>('debug.touch', v => {
  if (v) {
    debug.createCanvas()
    TouchRegistry.render = debug.render
  } else {
    debug.cleanup()
    delete TouchRegistry.render
  }
})
