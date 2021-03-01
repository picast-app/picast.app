import React from 'react'
import styled from 'styled-components'
import { Icon } from 'components/atoms'
import { desktop } from 'styles/responsive'
import Skip from './SkipControl'
import { usePlayer, useIsPlaying } from 'utils/player'

export default function PlayControls(props: { slot?: string }) {
  const player = usePlayer()
  const playing = useIsPlaying()

  return (
    <SC {...props}>
      <Skip ms={-15000} />
      <Icon
        icon={playing ? 'pause' : 'play'}
        label={playing ? 'pause' : 'play'}
        onClick={() => player?.[playing ? 'pause' : 'play']()}
        tabIndex={0}
        autoFocus
      />
      <Skip ms={30000} />
    </SC>
  )
}

const SC = styled.div`
  place-self: center;
  display: flex;
  align-items: center;

  --pb-size: 2.5rem;

  & > button[data-style~='icon-wrap'] {
    width: var(--pb-size);
    height: var(--pb-size);

    svg {
      width: 80%;
      height: 80%;
    }
  }

  @media ${desktop} {
    --pb-size: 4rem;
  }
`

export const ControlsSC = SC
