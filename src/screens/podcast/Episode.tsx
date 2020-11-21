import React from 'react'
import styled from 'styled-components'
import type * as T from 'gql/types'
import { desktop } from 'styles/responsive'
import { Button, Icon } from 'components/atoms'
import { center } from 'styles/mixin'
import { useTrackState } from 'utils/player'

export default function Episode({
  title,
  file,
}: T.PodcastPage_podcast_episodes) {
  const state = useTrackState(file as string)

  function toggle() {
    if (!file) return
    if (state === 'playing') window.dispatchEvent(new CustomEvent('echo_pause'))
    else
      window.dispatchEvent(
        new CustomEvent<EchoPlayEvent['detail']>('echo_play', {
          detail: { track: file },
        })
      )
  }

  return (
    <S.Episode>
      <article>
        <h1>{title}</h1>
        <Button iconWrap="play" onClick={toggle}>
          <Icon icon={state === 'paused' ? 'play' : 'pause'} />
        </Button>
      </article>
    </S.Episode>
  )
}

const S = {
  Episode: styled.li`
    article {
      height: 4rem;
      display: flex;
      padding: 0.5rem;
      align-items: center;
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
