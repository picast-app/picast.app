import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useCanvas } from 'utils/hooks'
import debounce from 'lodash/debounce'

export default function Glow() {
  const [ref, setRef] = useState<HTMLCanvasElement | null>(null)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [ctx, width, height] = useCanvas(ref)

  useEffect(() => {
    if (!ref) return
    const grid = ref.previousElementSibling!
    const observer = new MutationObserver(() => {
      setBoxes(
        (Array.from(grid.children).filter(
          node => node.nodeName === 'A'
        ) as any).map((v: HTMLElement) => {
          const el: HTMLElement = v.firstElementChild as any
          if (!el) return
          const x = el.offsetLeft * devicePixelRatio
          const y = el.offsetTop * devicePixelRatio
          let { width, height } = el.getBoundingClientRect()
          width *= devicePixelRatio
          height *= devicePixelRatio
          return [x, y, width, height]
        })
      )
    })
    observer.observe(grid, { childList: true })
    return () => observer.disconnect()
  }, [ref])

  useEffect(() => {
    if (!ctx || !boxes.length) return

    const { x, y } = ref!.getBoundingClientRect()
    let rfId: number

    let shouldRender = true

    const renderFrame = () => {
      if (cursor) render(ref!, ctx, boxes, cursor[0] - x, cursor[1] - y)
      if (shouldRender) rfId = requestAnimationFrame(renderFrame)
    }

    renderFrame()

    return () => cancelAnimationFrame(rfId)

    // eslint-disable-next-line
  }, [boxes, ctx, width, height])

  // function useMouseMoving() {
  //   const [moving, setMoving] = useState(false)

  //   useEffect(() => {
  //     const stop = debounce(
  //       () => {
  //         window.removeEventListener('mousemove', stop)
  //         console.log('stop')
  //       },
  //       50,
  //       { leading: false, trailing: true }
  //     )
  //     window.addEventListener('mousemove', stop, { passive: true })

  //     return () => window.removeEventListener('mousemove', stop)
  //   }, [])

  //   return moving
  // }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cursor = [e.pageX, e.pageY]
    }

    window.addEventListener('mousemove', onMove, { passive: true })

    return () => window.removeEventListener('mousemove', onMove)
  })

  return <S.Canvas ref={setRef}></S.Canvas>
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
  ctx.lineWidth = devicePixelRatio * 4

  const gradient = ctx.createRadialGradient(
    x * devicePixelRatio,
    y * devicePixelRatio,
    devicePixelRatio * 50,
    x * devicePixelRatio,
    y * devicePixelRatio,
    devicePixelRatio * 250
  )

  gradient.addColorStop(0, '#ffff')
  gradient.addColorStop(1, '#fff0')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // return

  ctx.globalCompositeOperation = 'destination-in'
  ctx.beginPath()

  for (const [x, y, w, h] of boxes) ctx.rect(x, y, w, h)

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
