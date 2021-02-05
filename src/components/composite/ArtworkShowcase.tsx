import React, { useRef, useEffect } from 'react'
import styled from 'styled-components'
import { animateTo } from 'utils/animate'
import { useComputed } from 'utils/hooks'

type Props = {
  src: string
  covers?: string[]
  onClose(): void
}

export function ArtworkShowcase({ src, covers, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const preview = useComputed(covers, covers => {
    if (!covers) return src
    const select = covers.find(v => v.includes('360.webp'))
    return select ? `${process.env.IMG_HOST}/${select}` : src
  })

  useEffect(() => {
    const background = ref.current?.firstChild as HTMLElement
    if (!ref.current || !background || !preview) return
    background.style.backgroundImage = `url('${preview}')`
    const opts = { duration: 300, easing: 'ease-out' }
    animateTo(ref.current, { opacity: 1 }, opts)
    ref.current
      .querySelectorAll('img')
      .forEach(img => animateTo(img, { transform: 'scale(1' }, opts))
  }, [preview])

  function close() {
    const background = ref.current?.firstChild as HTMLElement
    if (!ref.current || !background) return
    const opts = { duration: 250, easing: 'ease-in' }
    ref.current
      .querySelectorAll('img')
      .forEach((img, i) =>
        animateTo(
          img,
          { transform: 'scale(0.7)' },
          opts,
          i === 0 ? () => requestAnimationFrame(onClose) : undefined
        )
      )
  }

  return (
    <S.Wrap onClick={close} ref={ref}>
      <S.Background />
      {preview && <S.Preview src={preview} alt="" />}
      <img src={src} alt="" />
    </S.Wrap>
  )
}

const S = {
  Wrap: styled.div`
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    z-index: 20000;
    backdrop-filter: blur(20px) brightness(10%);
    opacity: 0;

    img {
      --size: 90vmin;
      position: absolute;
      left: calc(50% - var(--size) / 2);
      top: calc(50% - var(--size) / 2);
      width: var(--size);
      height: var(--size);
      cursor: zoom-out;
      transform: scale(0.7);
    }
  `,

  Preview: styled.img`
    pointer-events: none;
  `,

  Background: styled.div`
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    opacity: 0.8;
    filter: blur(80px) saturate(200%) brightness(30%);
  `,
}
