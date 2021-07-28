import React, { useState, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { useTheme } from 'app/hooks'
import type { Podcast } from 'app/store/state'

export default function Background({ podcast }: { podcast: Podcast }) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D>()
  const [img, setImg] = useState<HTMLImageElement>()
  const theme = useTheme()

  const src = useMemo(() => {
    if (!podcast.covers?.length) return podcast.artwork!
    else {
      const srcs = podcast.covers.filter(v => v.endsWith('.webp'))
      return `${process.env.IMG_HOST}/${
        srcs
          .map(v => [parseInt(v.split('.')[0].split('-').pop()!), v] as const)
          .sort(([a], [b]) => b - a)[0][1]
      }`
    }
  }, [podcast])

  useEffect(() => {
    if (!src) return
    const img = new Image()
    img.onload = () => {
      setImg(img)
    }
    img.src = src
  }, [src])

  useEffect(() => {
    if (!canvas || !img) return
    canvas.width = window.innerWidth * devicePixelRatio
    canvas.height = window.innerHeight * devicePixelRatio
    setCtx(canvas.getContext('2d')!)
  }, [canvas, img])

  useEffect(() => {
    if (!ctx || !canvas || !img) return
    ctx.globalAlpha = 1
    ctx.filter = ''
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let scale = canvas.height / img.height
    scale *= 1.3

    ctx.fillStyle = theme === 'light' ? '#fff' : '#000'

    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.globalAlpha = theme === 'light' ? 0.15 : 0.3
    ctx.filter = `blur(${120 * devicePixelRatio}px) brightness(${
      theme === 'dark' ? 50 : 170
    }%) saturate(${theme === 'dark' ? 150 : 200}%)`

    ctx.drawImage(
      img,
      (canvas.width - scale * img.width) / 2,
      (canvas.height - scale * img.height) / 2,
      scale * img.width,
      scale * img.height
    )
  }, [ctx, canvas, img, theme])

  return <Canvas ref={setCanvas} />
}

const Canvas = styled.canvas`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
`
