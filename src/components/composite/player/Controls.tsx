import React from 'react'
import styled from 'styled-components'
import { Icon } from 'components/atoms'
import { usePlayState, togglePlay } from 'utils/player'
import { center } from 'styles/mixin'
import { desktop, mobile } from 'styles/responsive'

export default function PlayControls() {
  const playState = usePlayState()

  return (
    <S.PlayControls>
      <Icon
        icon={playState === 'paused' ? 'play' : 'pause'}
        label={playState === 'paused' ? 'play' : 'pause'}
        onClick={togglePlay}
      />
    </S.PlayControls>
  )
}

const S = {
  PlayControls: styled.div`
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: fixed;
    z-index: 9000;

    --pb-size: 2.5rem;

    button[data-style~='icon-wrap'] {
      background-color: var(--cl-text);
      width: var(--pb-size);
      height: var(--pb-size);
      border-radius: 50%;
      position: relative;
    }

    svg {
      fill: var(--cl-surface);
      width: 80%;
      height: 80%;
      ${center}
    }

    @media ${desktop} {
      position: absolute;
      width: var(--sidebar-width);
      height: 100%;
      left: 0;
      transform: translateX(-100%);

      --pb-size: 4rem;

      button[data-style~='icon-wrap'] {
        background-color: transparent;
      }

      svg {
        fill: var(--cl-text);
      }
    }

    @media ${mobile} {
      ${center}
    }
  `,
}
