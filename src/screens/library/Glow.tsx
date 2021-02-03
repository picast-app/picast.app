import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useCanvas } from 'utils/hooks'
import debounce from 'lodash/debounce'

export default function Glow() {
  const [ref, setRef] = useState<HTMLCanvasElement | null>(null)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [ctx, width, height] = useCanvas(ref)
  const moving = useMouseMoving()

  useEffect(() => {
    if (!ref) return
    const grid = ref.previousElementSibling!

    const update = () => {
      setBoxes(
        (Array.from(grid.children).filter(
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
      )
    }
    update()

    const observer = new MutationObserver(update)
    observer.observe(grid, { childList: true })
    return () => observer.disconnect()
  }, [ref, width])

  useEffect(() => {
    if (!ctx || !boxes.length || !moving) return

    const { x, y } = ref!.getBoundingClientRect()
    let rfId: number

    const renderFrame = () => {
      if (cursor) render(ref!, ctx, boxes, cursor[0] - x, cursor[1] - y)
      if (moving) rfId = requestAnimationFrame(renderFrame)
    }

    renderFrame()

    return () => cancelAnimationFrame(rfId)
  }, [boxes, ctx, width, height, moving, ref])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cursor = [e.pageX, e.pageY]
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  })

  return <S.Canvas ref={setRef}></S.Canvas>
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
  x: number,
  y: number
) {
  // eslint-disable-next-line
  canvas.width = canvas.width
  ctx.fillStyle = '#fff'
  ctx.lineWidth = devicePixelRatio * 2

  const cx = x * devicePixelRatio
  const cy = y * devicePixelRatio
  const rm = devicePixelRatio * 100

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

  const gradient = ctx.createRadialGradient(
    cx,
    cy,
    devicePixelRatio * 20,
    cx,
    cy,
    rm
  )

  gradient.addColorStop(0, '#ffff')
  gradient.addColorStop(0.3, '#fff8')
  gradient.addColorStop(1, '#fff0')
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
