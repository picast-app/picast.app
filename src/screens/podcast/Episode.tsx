import React from 'react'
import styled from 'styled-components'
import { desktop } from 'styles/responsive'
import { Button, Icon } from 'components/atoms'
import { center } from 'styles/mixin'
import { useTrackState } from 'utils/player'

type Props = EpisodeMin & { index: number }

export default function Episode({ title, file, index }: Props) {
  const state = useTrackState(file as string)

  return (
    <S.Episode style={{ top: `${index * 3.8}rem` }}>
      <article>
        <h1>{title}</h1>
        <Button iconWrap="play" onClick={() => file && toggle(file, state)}>
          <Icon icon={state === 'paused' ? 'play' : 'pause'} />
        </Button>
      </article>
    </S.Episode>
  )
}

function toggle(file: string, state: 'playing' | 'paused') {
  if (!file) return
  if (state === 'playing') window.dispatchEvent(new CustomEvent('echo_pause'))
  else
    window.dispatchEvent(
      new CustomEvent<EchoPlayEvent['detail']>('echo_play', {
        detail: { track: file },
      })
    )
}

const S = {
  Episode: styled.li`
    position: absolute;
    width: 100%;

    article {
      height: 3.8rem;
      display: flex;
      padding: 0 1rem;
      align-items: center;
      font-size: 0.9rem;
    }

    --border: 1px solid var(--cl-border);

    &:not(:first-of-type) {
      border-top: var(--border);
    }

    @media ${desktop} {
      &:first-of-type {
        border-top: var(--border);
      }

      &:last-of-type {
        border-bottom: var(--border);
      }
    }

    button {
      --color: var(--cl-text);

      margin-left: auto;
      border: 2px solid var(--color);
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      position: relative;

      svg {
        fill: var(--color);
        ${center}
      }
    }
  `,
}
