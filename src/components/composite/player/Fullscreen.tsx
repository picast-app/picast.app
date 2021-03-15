import React, { useEffect, useState, useMemo } from 'react'
import styled from 'styled-components'
import { Artwork } from 'components/atoms'
import { useTheme, useMatchMedia } from 'utils/hooks'
import Controls, { ControlsSC } from './Controls'
import { desktop } from 'styles/responsive'
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

  if (useMatchMedia(desktop)) return null
  return (
    <S.Container {...props}>
      <Background src={background} />
      <S.Player>
        <S.EpisodeInfo>
          <Artwork
            src={podcast.artwork}
            title={podcast.title}
            covers={podcast.covers}
            sizes={[0.8 * window.innerWidth]}
          />
          <S.Title>{episode.title}</S.Title>
          <S.Podcast>{podcast.title}</S.Podcast>
        </S.EpisodeInfo>
        <player-progress />
        <Controls />
      </S.Player>
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
    ctx.globalAlpha = 0.3
    ctx.filter = `blur(${120 * devicePixelRatio}px) brightness(${
      theme === 'dark' ? 50 : 150
    }%) saturate(150%)`

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
  Container: styled.div`
    position: absolute;
    --top-padd: 3rem;
    padding-top: var(--top-padd);
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  `,

  Background: styled.canvas`
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  `,

  Player: styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 5rem;

    player-progress {
      width: 90vw;
    }

    ${ControlsSC} {
      transform: scale(1.3);

      & > button {
        transform: scale(1.1);
        margin: 0 1rem;
      }
    }
  `,

  EpisodeInfo: styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--cl-text-strong);
    text-align: center;

    img {
      width: 80vw;
      height: 80vw;
      border-radius: 0.5rem;
    }

    span {
      margin-top: 1.2em;
    }
  `,

  Title: styled.span`
    font-size: 1.2rem;
    max-width: 80vw;
    line-height: 1.3;
  `,

  Podcast: styled.span`
    font-size: 0.9rem;
    opacity: 0.8;
  `,
}
