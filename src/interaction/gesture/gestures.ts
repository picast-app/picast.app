import Registry, { TouchRegistryEvent } from './registry'
import EventManager, { EventDef } from 'utils/event'
import store from 'store/threadAPI'

const registry = new Registry()

export const ignore = (list: TouchList) => registry.ignore(list)

// @ts-ignore
abstract class Gesture<T extends EventDef = {}> extends EventManager<
  { end: (cancelled?: boolean) => void } & T
> {
  constructor(protected readonly touch: TouchRegistryEvent) {
    super()
    this.onEnd = this.onEnd.bind(this)
    touch.addEventListener('end', this.onEnd)
  }

  protected skipCheck?(e: TouchRegistryEvent): boolean
  protected abstract onMove(e: TouchRegistryEvent): void

  private onEnd() {
    // @ts-ignore
    this.call('end')
  }

  protected cancel(): true {
    this.touch.removeEventListener('move', this.onMove)
    this.touch.removeEventListener('end', this.onEnd)
    // @ts-ignore
    this.call('end', true)
    return true
  }
}

export class VerticalSwipe extends Gesture<{ move: (offY: number) => void }> {
  protected anchor: number

  constructor(touch: TouchRegistryEvent) {
    super(touch)
    this.anchor = touch.path[0][1]

    this.onMove = this.onMove.bind(this)
    touch.addEventListener('move', this.onMove)
  }

  protected onMove(e: TouchRegistryEvent) {
    const y = this.touch.path.slice(-1)[0][1]
    this.anchorCheck(y)
    if (this.skipCheck?.(e)) return
    this.call('move', this.anchor - y)
  }

  get lastY() {
    return this.anchor - this.touch.path.slice(-1)[0][1]
  }

  get velocity() {
    if (this.touch.path.length < 2) return 0
    const [[, y1], [, y0]] = this.touch.path.slice(-2)
    return y0 - y1
  }

  protected anchorCheck(y: number) {}
}

export class UpwardSwipe extends VerticalSwipe {
  anchorCheck(y: number) {
    if (y > this.anchor) this.anchor = y
  }
}

export class DownwardSwipe extends VerticalSwipe {
  anchorCheck(y: number) {
    if (y < this.anchor) this.anchor = y
  }
}

export class ExclusiveDownwardSwipe extends DownwardSwipe {
  skipCheck({ path: [[x0, y0], [x1, y1]] }: TouchRegistryEvent) {
    if (Math.abs(x1 - x0) > Math.abs(y1 - y0)) return this.cancel()
    this.skipCheck = undefined as any
    return false
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
store.listenX('settings.debug.showTouchPaths', v => {
  DEBUG = !!v
  GestureController.active.forEach(v => v.style())
})
