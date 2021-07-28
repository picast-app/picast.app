import React from 'react'
import styled from 'styled-components'
import { Icon } from 'app/components/atoms'
import { center } from 'app/styles/mixin'
import { useMatchMedia } from 'app/hooks'
import { mobile } from 'app/styles/responsive'

type Props = {
  ms: number
  onJump: (n: number) => void
}

export default function SkipControl({ ms, onJump }: Props) {
  const isMobile = useMatchMedia(mobile)

  return (
    <S.Wrap data-dir={ms >= 0 ? 'forward' : 'backward'}>
      <Icon
        icon="skip"
        onClick={() => onJump(ms / 1000)}
        label={`skip ${Math.abs(ms / 1000)} seconds ${
          ms > 0 ? 'forward' : 'backward'
        }`}
        ripple={isMobile}
      />
      <S.Label aria-hidden>{Math.abs(ms / 1000)}</S.Label>
    </S.Wrap>
  )
}

const S = {
  Wrap: styled.div`
    position: relative;
    width: 3.5rem;
    height: 3.5rem;
    font-size: 2rem;

    & > button[data-style~='icon-wrap'] {
      transform-origin: center;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }

    svg {
      ${center}
      width: 80%;
      height: 80%;
    }

    &[data-dir='backward'] button[data-style~='icon-wrap'] {
      transform: rotateY(180deg);
    }
  `,

  Label: styled.span`
    ${center}
    font-size: 0.3em;
    margin-top: 3%;
    font-weight: bold;
    color: var(--cl-icon);
    pointer-events: none;
  `,
}
