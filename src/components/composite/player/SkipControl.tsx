import React from 'react'
import styled from 'styled-components'
import { Icon } from 'components/atoms'
import { center } from 'styles/mixin'

type Props = {
  ms: number
}

export default function SkipControl({ ms }: Props) {
  return (
    <S.Wrap data-dir={ms >= 0 ? 'forward' : 'backward'}>
      <Icon
        icon="skip"
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent<EchoSkipEvent['detail']>('echo_skip', {
              detail: { seconds: ms / 1000 },
            })
          )
        }}
        label={`skip ${Math.abs(ms / 1000)} seconds ${
          ms > 0 ? 'forward' : 'backward'
        }`}
      />
      <S.Label aria-hidden>{Math.abs(ms / 1000)}</S.Label>
    </S.Wrap>
  )
}

const S = {
  Wrap: styled.div`
    position: relative;
    width: 2rem;
    height: 2rem;
    font-size: 2rem;

    & > button[data-style~='icon-wrap'],
    svg {
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
    }

    svg {
      transform-origin: center;
      transform: scale(1.2);
    }

    &[data-dir='backward'] svg {
      transform: scale(1.2) rotateY(180deg);
    }
  `,

  Label: styled.span`
    ${center}
    font-size: 0.3em;
    margin-top: 7%;
    color: var(--cl-icon);
    pointer-events: none;
  `,
}
