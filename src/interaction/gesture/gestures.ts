import { main, proxy } from 'workers'
import Registry, { TouchRegistryEvent } from './registry'
import EventManager, { EventDef } from 'utils/event'

const registry = new Registry()

// @ts-ignore
abstract class Gesture<T extends EventDef = {}> extends EventManager<
  { end: () => void } & T
> {
  constructor(protected readonly touch: TouchRegistryEvent) {
    super()
    // @ts-ignore
    touch.addEventListener('end', () => this.call('end'))
  }
}

export class VerticalSwipe extends Gesture<{ move: (offY: number) => void }> {
  private maxY: number

  constructor(touch: TouchRegistryEvent) {
    super(touch)
    this.maxY = touch.path[0][1]

    touch.addEventListener('move', () => {
      const y = this.touch.path.slice(-1)[0][1]
      if (y > this.maxY) this.maxY = y
      this.call('move', this.maxY - y)
    })
  }

  get lastY() {
    return this.maxY - this.touch.path.slice(-1)[0][1]
  }

  get velocity() {
    const [[, y0], [, y1 = y0] = []] = this.touch.path.reverse()
    return y1 - y0
  }
}

export class GestureController<T extends Gesture> extends EventManager<{
  start: (gesture: T) => void
}> {
  private observer?: ResizeObserver
  private startBox?: DOMRect
  static active: GestureController<any>[] = []

  constructor(
    private readonly gesture: new (...args: any[]) => T,
    private readonly startNode: HTMLElement
  ) {
    super()
    this.onTouchStart = this.onTouchStart.bind(this)
  }

  public start() {
    this.style()
    document.documentElement.appendChild(this.startNode)

    this.observer = new ResizeObserver(() => {
      this.startBox = this.startNode.getBoundingClientRect()
    })
    this.observer.observe(this.startNode)

    registry.addEventListener('start', this.onTouchStart)
    GestureController.active.push(this)
  }

  public stop() {
    registry.removeEventListener('start', this.onTouchStart)
    document.documentElement.removeChild(this.startNode)
    this.observer?.disconnect()
    delete this.startBox
    if (GestureController.active.includes(this))
      GestureController.active.splice(GestureController.active.indexOf(this), 1)
  }

  private onTouchStart(e: TouchRegistryEvent) {
    if (!this.startBox) return
    const { left, right, top, bottom } = this.startBox
    if (e.x < left || e.x > right || e.y < top || e.y > bottom) return
    e.claim()
    this.call('start', new this.gesture(e))
  }

  public style() {
    Object.assign(
      this.startNode.style,
      DEBUG
        ? {
            zIndex: 15000,
            backgroundColor: '#f002',
            pointerEvents: 'none',
            visibility: '',
          }
        : { visibility: 'hidden' }
    )
  }
}

let DEBUG = false
main.state(
  'debug.touch',
  proxy(v => {
    DEBUG = !!v
    GestureController.active.forEach(v => v.style())
  })
)
