abstract class Gesture {}

class VerticalSwipe extends Gesture {
  constructor(public readonly anchor: number) {
    super()
  }
}

class GestureController<T extends Gesture> {
  private observer?: ResizeObserver
  private startBox?: DOMRect

  constructor(
    private readonly gesture: new (...args: any[]) => T,
    private readonly startNode: HTMLElement
  ) {
    Object.assign(
      startNode.style,
      DEBUG
        ? { zIndex: 15000, backgroundColor: '#f002', pointerEvents: 'none' }
        : { visibility: 'hidden' }
    )
    this.onTouchStart = this.onTouchStart.bind(this)
  }

  public start() {
    document.documentElement.appendChild(this.startNode)

    this.observer = new ResizeObserver(() => {
      this.startBox = this.startNode.getBoundingClientRect()
    })
    this.observer.observe(this.startNode)

    window.addEventListener('touchstart', this.onTouchStart)
  }

  public stop() {
    window.removeEventListener('touchstart', this.onTouchStart)
    document.documentElement.removeChild(this.startNode)
    this.observer?.disconnect()
    delete this.startBox
  }

  private onTouchStart({ touches: [{ pageX: x, pageY: y }] }: TouchEvent) {
    if (!this.startBox) return
    const { left, right, top, bottom } = this.startBox
    if (x < left || x > right || y < top || y > bottom) return
    // logger.info('gesture start')

    window.addEventListener('touchmove', e => {
      // console.log(e.touches)
    })
  }
}

const area = document.createElement('div')
Object.assign(area.style, {
  position: 'fixed',
  bottom: 0,
  width: '100vw',
  height: 'calc(var(--bar-height) + var(--player-height)) ',
})

const controller = new GestureController(VerticalSwipe, area)
controller.start()

if (DEBUG) {
  debug.createCanvas()
  debug.draw()
}
