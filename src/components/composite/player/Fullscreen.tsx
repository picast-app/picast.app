import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Icon } from 'components/atoms'

interface Props {
  hidden?: boolean
  onHide(): void
}

export default function Fullscreen({ hidden, onHide }: Props) {
  const [visible, setVisible] = useState(hidden)

  useEffect(() => {
    if (!hidden) setVisible(true)
    else setTimeout(() => setVisible(false), 600)
  }, [hidden])

  if (!visible) return null
  return (
    <S.Fullscreen>
      <S.Main>
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

    &::before {
      content: '';
      background-color: var(--cl-background);
      position: absolute;
      top: calc(var(--bar-height) * (1 - var(--player-in)));
      left: 0;
      height: calc(var(--player-in) * 100vh);
      width: 100vw;
      z-index: -1;
    }
  `,

  Main: styled.div`
    background-color: var(--cl-background);
    opacity: calc(var(--player-in) * 3);
    width: 100%;
    height: 100%;
  `,
}
