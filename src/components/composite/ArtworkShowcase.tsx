import React, { useRef, useEffect } from 'react'
import styled from 'styled-components'
import { mobile } from 'styles/responsive'
import { animateTo } from 'utils/animate'

type Props = {
  src: string
  onClose(): void
}

export function ArtworkShowcase({ src, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const background = ref.current?.firstChild as HTMLElement
    const img = ref.current?.lastChild as HTMLElement
    if (!ref.current || !background || !img || !src) return
    background.style.backgroundImage = `url('${src}')`
    const opts = { duration: 300, easing: 'ease-out' }
    animateTo(ref.current, { opacity: 1 }, opts)
    animateTo(img, { transform: 'scale(1)' }, opts)
  }, [src])

  function close() {
    const background = ref.current?.firstChild as HTMLElement
    const img = ref.current?.lastChild as HTMLElement
    if (!ref.current || !background || !img) return
    const opts = { duration: 250, easing: 'ease-in' }
    animateTo(ref.current, { opacity: 0 }, opts)
    animateTo(img, { transform: 'scale(0.7)' }, opts, onClose)
  }

  return (
    <S.Wrap onClick={close} ref={ref}>
      <S.Background />
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

      @media ${mobile} {
        --size: 100vmin;
      }
    }
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
