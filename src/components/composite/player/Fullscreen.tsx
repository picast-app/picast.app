import React from 'react'
import styled from 'styled-components'
import { Icon } from 'components/atoms'

interface Props {
  onHide(): void
}

export default function Fullscreen({ onHide }: Props) {
  return (
    <S.Fullscreen>
      <S.Main id="fullscreen-player">
        <Icon icon="arrow_down" onClick={onHide} />
      </S.Main>
    </S.Fullscreen>
  )
}

const S = {
  Fullscreen: styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 12000;
    pointer-events: none;

    &[data-state='visible']::before {
      content: '';
      background-color: var(--cl-background);
      position: absolute;
      top: var(--bar-height);
      height: 100%;
      left: 0;
      width: 100vw;
      z-index: -1;
    }
  `,

  Main: styled.div`
    background-color: var(--cl-background);
    opacity: 0;
    width: 100%;
    height: 100%;
    transform: translateY(var(--bar-height));
  `,
}
