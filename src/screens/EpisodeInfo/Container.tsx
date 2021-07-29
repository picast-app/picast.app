import React, { useState } from 'react'
import styled from 'styled-components'
import { history } from '@picast-app/router'
import { mobile, desktop } from 'styles/responsive'
import { useMatchMedia } from 'hooks'
import { useTransitionIn, useTransitionOut, useSwipe } from './interaction'

export function Container({ children }: any) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const isMobile = useMatchMedia(mobile)

  const close = () => history.push({})

  const animated = isMobile ? ref : null
  useTransitionIn(animated)
  const transitionOut = useTransitionOut(animated, close)
  useSwipe(animated, close)

  return (
    <S.Shade ref={setRef} onClick={transitionOut}>
      <S.Container onClick={e => e.stopPropagation()}>{children}</S.Container>
    </S.Shade>
  )
}

const S = {
  Shade: styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 11000;
    background-color: #0000;
    will-change: transform;

    @media ${desktop} {
      backdrop-filter: blur(1px) brightness(0.5);
    }
  `,

  Container: styled.div`
    position: absolute;
    top: 100%;
    width: 100%;
    height: 100vh;
    background-color: var(--cl-surface);

    --border-radius: 0.5rem;
    border-radius: var(--border-radius);

    @media ${desktop} {
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: clamp(35rem, 40vw, 50rem);
      max-width: 100vw;
      height: unset;
      min-height: 25rem;
      max-height: 80vh;
    }

    @media ${mobile} {
      border-radius: 0;
      border-top-left-radius: var(--border-radius);
      border-top-right-radius: var(--border-radius);
    }

    [data-anchor='top'] > & {
      --border-radius: 0;
    }
  `,
}
