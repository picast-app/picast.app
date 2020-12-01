import React from 'react'
import styled from 'styled-components'
import { Icon } from 'components/atoms'
import { usePlayState, togglePlay } from 'utils/player'
import { center } from 'styles/mixin'
import { desktop, mobile } from 'styles/responsive'
import Skip from './SkipControl'

export default function PlayControls() {
  const playState = usePlayState()

  return (
    <S.PlayControls>
      <Skip ms={-15000} />
      <Icon
        icon={playState === 'paused' ? 'play' : 'pause'}
        label={playState === 'paused' ? 'play' : 'pause'}
        onClick={togglePlay}
      />
      <Skip ms={30000} />
    </S.PlayControls>
  )
}

const S = {
  PlayControls: styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    z-index: 9000;

    --pb-size: 2.5rem;

    & > button[data-style~='icon-wrap'] {
      width: var(--pb-size);
      height: var(--pb-size);
      border-radius: 50%;
      position: relative;
      margin: 0 1rem;
      background-color: var(--cl-icon);

      svg {
        width: 80%;
        height: 80%;
        ${center}
        --cl-icon: var(--cl-surface);
      }
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

        svg {
          --cl-icon: unset;
        }
      }
    }

    @media ${mobile} {
      ${center}
    }
  `,
}

export const ControlsSC = S.PlayControls
