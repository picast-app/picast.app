import React, { useEffect, useState, useMemo } from 'react'
import styled from 'styled-components'
import { Artwork } from 'components/atoms'
import { useTheme } from 'utils/hooks'
import type { Podcast } from 'main/store/types'

interface Props {
  podcast: Podcast
  episode: EpisodeMin
  slot?: string
}

export default function Fullscreen({ podcast, episode, ...props }: Props) {
  const background = useMemo(() => {
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

  return (
    <S.Container {...props}>
      <Background src={background} />
      {/* <Artwork
        src={podcast.artwork}
        title={podcast.title}
        covers={podcast.covers}
      /> */}
    </S.Container>
  )
}

function Background({ src }: { src: string }) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D>()
  const [img, setImg] = useState<HTMLImageElement>()
  const theme = useTheme()

  useEffect(() => {
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
    ctx.globalAlpha = 0.2
    ctx.filter = `blur(${120 * devicePixelRatio}px) saturate(150%)`

    ctx.drawImage(
      img,
      (canvas.width - scale * img.width) / 2,
      (canvas.height - scale * img.height) / 2,
      scale * img.width,
      scale * img.height
    )
  }, [ctx, canvas, img, theme])

  return <S.Background ref={setCanvas} />
}

const S = {
  Container: styled.div``,

  Background: styled.canvas`
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  `,
}
