import React from 'react'
import { Icon } from 'components/atoms'
import styled from 'styled-components'
import { mobile } from 'styles/responsive'

type Props = {
  playing: boolean
  onClick(): void
}

export default function PlayButton({ playing, onClick }: Props) {
  const action = playing ? 'pause' : 'play'
  return (
    <SC>
      <Icon
        icon={action}
        label={action}
        onClick={onClick}
        tabIndex={0}
        autoFocus
      />
    </SC>
  )
}

const svgWidth = 95
const SC = styled.div`
  button[data-style~='icon-wrap'] {
    --size: 4rem;
    width: var(--size);
    height: var(--size);
    position: relative;

    svg {
      position: absolute;
      left: ${50 - svgWidth / 2}%;
      top: ${50 - svgWidth / 2}%;
      width: ${svgWidth}%;
      height: ${svgWidth}%;
    }

    @media ${mobile} {
      background-color: var(--cl-icon);
      border-radius: 50%;
      --size: 3rem;
      margin: 0 1rem;

      svg {
        fill: var(--cl-background);
      }
    }

    &[title='pause'] {
      svg {
        transform: scale(0.85);
      }
    }
  }
`
