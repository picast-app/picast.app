import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import debounce from 'lodash/debounce'
import { useCanvas, useComputed, useTheme } from 'hooks'
import { desktopPts, cardPadd } from './grid'

const sidebarWidth = 15 * 16

export default function Glow() {
  const [ref, setRef] = useState<HTMLCanvasElement | null>(null)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [ctx, width, height] = useCanvas(ref, { desynchronized: true })
  const moving = useMouseMoving()
  const [columns, _width] = useComputed(width, (v): [number, number] => {
    const vw = v / devicePixelRatio + sidebarWidth
    for (let i = 0; i < desktopPts.length; i++)
      if (desktopPts[i][0] > vw) return [desktopPts[Math.max(i - 1, 0)][1], v]
    return [desktopPts.slice(-1)[0][1], _width]
  })
  const theme = useTheme()

  useEffect(() => {
    if (!ref || !_width) return
    const grid = ref.previousElementSibling!

    const update = () => {
      const boxes = (Array.from(grid.children).filter(
        node => node.nodeName === 'A'
      ) as any).map((v: HTMLElement) => {
        const el: HTMLElement = v.firstElementChild as any
        const x = el.offsetLeft * devicePixelRatio
        const y = el.offsetTop * devicePixelRatio
        let { width, height } = el.getBoundingClientRect()
        width *= devicePixelRatio
        height *= devicePixelRatio
        return [x, y, width, height]
      })
      if (!boxes.length) {
        const padd = cardPadd * devicePixelRatio
        const cw = (_width - padd) / columns
        const rows = Math.ceil((window.innerHeight / cw) * devicePixelRatio)
        for (let x = 0; x < columns; x++) {
          for (let y = 0; y < rows; y++) {
            const box = [x * cw + padd, y * cw + padd, cw - padd, cw - padd]
            boxes.push(box)
          }
        }
      }
      setBoxes(boxes)
    }
    update()

    const observer = new MutationObserver(update)
    observer.observe(grid, { childList: true })
    return () => observer.disconnect()
  }, [ref, _width, columns])

  useEffect(() => {
    if (!ctx || !boxes.length || !moving) return

    const { x, y } = ref!.getBoundingClientRect()
    let rfId: number

    if (ref && ref!.previousElementSibling!.clientHeight > ref.clientHeight)
      ref.style.height = `${ref.previousElementSibling!.clientHeight}px`

    const renderFrame = () => {
      if (cursor)
        render(
          ref!,
          ctx,
          boxes,
          theme === 'light' ? '#000' : '#fff',
          cursor[0] - x,
          cursor[1] - y
        )
      if (moving) rfId = requestAnimationFrame(renderFrame)
    }

    renderFrame()

    return () => cancelAnimationFrame(rfId)
  }, [boxes, ctx, width, height, moving, ref, theme])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cursor = [e.pageX, e.pageY]
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  })

  return <S.Canvas ref={setRef} />
}

function useMouseMoving() {
  const [moving, setMoving] = useState(false)

  useEffect(() => {
    const listenMove = () => {
      window.addEventListener(
        'mousemove',
        () => {
          setMoving(true)
          window.addEventListener('mousemove', stop, { passive: true })
        },
        { once: true, passive: true }
      )
    }
    listenMove()

    const stop = debounce(
      () => {
        window.removeEventListener('mousemove', stop)
        setMoving(false)
        listenMove()
      },
      100,
      { leading: false, trailing: true }
    )

    return () => window.removeEventListener('mousemove', stop)
  }, [])

  return moving
}

let cursor: [number, number] | undefined = undefined
type Box = [x: number, y: number, w: number, h: number]

function render(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  boxes: Box[],
  color: string,
  x: number,
  y: number
) {
  // eslint-disable-next-line
  canvas.width = canvas.width
  ctx.lineWidth = devicePixelRatio

  const cx = x * devicePixelRatio
  const cy = y * devicePixelRatio
  const rm = devicePixelRatio * 75

  const inSight: Box[] = []
  for (const box of boxes) {
    if (
      Math.abs(box[0] + box[2] / 2 - cx) >= rm + box[2] / 2 ||
      Math.abs(box[1] + box[3] / 2 - cy) >= rm + box[3] / 2
    )
      continue
    inSight.push(box)
  }
  if (inSight.length === 0) return

  const gradient = ctx.createRadialGradient(cx, cy, rm / 5, cx, cy, rm)

  gradient.addColorStop(0, color + 'f')
  gradient.addColorStop(0.3, color + '8')
  gradient.addColorStop(1, color + '0')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.globalCompositeOperation = 'destination-in'
  ctx.beginPath()

  for (const box of inSight) ctx.rect(...box)

  ctx.closePath()
  ctx.stroke()
}

// todo: initial mouse pos (binary search :hover)

const S = {
  Canvas: styled.canvas`
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
  `,
}
