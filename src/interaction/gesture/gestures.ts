import { main, proxy } from 'workers'
import Registry, { TouchRegistryEvent } from './registry'

let DEBUG = false

main.state(
  'debug.touch',
  proxy(v => {
    DEBUG = !!v
    GestureController.active.forEach(v => v.style())
  })
)

const registry = new Registry()

abstract class Gesture {}

export class VerticalSwipe extends Gesture {
  constructor(public readonly anchor: number) {
    super()
  }
}

export class GestureController<T extends Gesture> {
  private observer?: ResizeObserver
  private startBox?: DOMRect
  private touch?: TouchRegistryEvent
  static active: GestureController<any>[] = []

  constructor(
    private readonly gesture: new (...args: any[]) => T,
    private readonly startNode: HTMLElement
  ) {
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

    e.addEventListener('move', ({ path }) => console.log(path.slice(-1)[0]))
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
