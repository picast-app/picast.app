import type TouchRegistry from './registry'

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null

export function createCanvas() {
  canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.zIndex = '20000'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  ctx = canvas.getContext('2d', { desynchronized: true })
  document.documentElement.appendChild(canvas)
}

export function cleanup() {
  if (!canvas) return
  document.documentElement.removeChild(canvas)
  ctx = null
  canvas = null
}

const colors = ['#f00', '#0f0', '#00f', '#f0f', '#ff0', '#0ff']

export function render(registry: TouchRegistry) {
  if (!ctx) return

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

  for (const [id, { path }] of Object.entries(registry.active)) {
    const i = parseInt(id)
    ctx.fillStyle = colors[i]
    ctx.strokeStyle = colors[i]

    for (let i = 0; i < path.length; i++) {
      const [x, y] = path[i]
      const d = i === 0 ? 10 : 4
      ctx.fillRect(x - d / 2, y - d / 2, d, d)
      if (i === path.length - 1) continue
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(...path[i + 1]!)
      ctx.stroke()
    }
  }
}
