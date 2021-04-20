import React from 'react'
import styled from 'styled-components'
import { Icon } from 'components/atoms'
import { mobile } from 'styles/responsive'
import Skip from './SkipControl'
import { usePlayer, useIsPlaying } from 'utils/playerHooks'

export default function PlayControls(props: { slot?: string }) {
  const player = usePlayer()
  const playing = useIsPlaying()

  return (
    <SC {...props}>
      <Skip ms={-15000} onJump={n => player?.jump(n, true)} />
      <Icon
        icon={playing ? 'pause' : 'play'}
        label={playing ? 'pause' : 'play'}
        onClick={() => player?.[playing ? 'pause' : 'resume']()}
        tabIndex={0}
        autoFocus
      />
      <Skip ms={30000} onJump={n => player?.jump(n, true)} />
    </SC>
  )
}

const SC = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  --pb-size: 4.5rem;

  & > button[data-style~='icon-wrap'] {
    width: var(--pb-size);
    height: var(--pb-size);

    svg {
      width: 80%;
      height: 80%;
    }
  }

  @media ${mobile} {
    & > * {
      transform: scale(0.8);
    }
  }
`

export const ControlsSC = SC
