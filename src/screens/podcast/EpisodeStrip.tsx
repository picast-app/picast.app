import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Icon } from 'components/atoms'
import { main } from 'workers'
import type { EpisodeBase } from 'main/store/types'
import { proxy } from 'comlink'
import { playerSub, useEpisodePlaying, useEpisodeProgress } from 'utils/player'
import { useComputed } from 'utils/hooks'
import { mobile } from 'styles/responsive'
import { center, transition } from 'styles/mixin'

type Props = {
  feed: string
  index: number
}

export default function EpisodeStrip({ feed, index }: Props) {
  const episode = useEpisode(feed, index)
  const date = useComputed(episode?.published, format)

  if (!episode) return null
  return (
    <S.Strip index={index}>
      <S.Title>{episode.title}</S.Title>
      <S.Date>{date}</S.Date>
      <Duration>{episode.duration}</Duration>
      <S.Actions>
        <PlayButton
          id={[episode.podcast, episode.id] as any}
          progress={episode.relProg}
        />
      </S.Actions>
    </S.Strip>
  )
}

const { format } = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function useEpisode(feed: string, index: number) {
  const [episode, setEpisode] = useState<EpisodeBase>()

  useEffect(() => {
    let cancel: (() => void) | undefined = undefined
    ;(main.feedItem(feed, index, proxy(setEpisode)) as any).then((v: any) => {
      cancel = v
    })
    return () => cancel?.()
  }, [feed, index])

  return episode
}

const toggle = ([pod, ep]: EpisodeId) => async () => {
  const player = playerSub.state

  if (pod !== player?.podcast?.id || ep !== player?.episode?.id) {
    if (player) await player.play([pod, ep])
    else {
      const unsub = playerSub.subscribe(player => {
        player.play()
        unsub()
      })
      await main.setPlaying([pod, ep])
    }
  } else {
    if (player.playing) player.pause()
    else await player.play()
  }
}

function PlayButton({ id, progress }: { id: EpisodeId; progress: number }) {
  const playing = useEpisodePlaying(id)
  return (
    <S.Play>
      <EpisodeProgress episode={id} initial={progress} />
      <Icon
        icon={playing ? 'pause' : 'play'}
        label={playing ? 'pause' : 'play'}
        onClick={toggle(id)}
      />
    </S.Play>
  )
}

const width = 8
const rad = 50 - width / 2
const circ = 2 * Math.PI * rad

function EpisodeProgress({
  episode,
  initial,
}: {
  episode: EpisodeId
  initial: number
}) {
  const { progress, playing, duration } = useEpisodeProgress(episode, initial)
  return (
    <S.Progress
      viewBox="0 0 100 100"
      progress={progress}
      remaining={duration * (1 - progress)}
    >
      <circle
        cx={50}
        cy={50}
        r={rad}
        data-style={progress > 0 || playing ? 'empty' : 'full'}
      />
      {progress < 1 && (
        <circle
          cx={50}
          cy={50}
          r={rad}
          strokeDasharray={`${circ} ${circ}`}
          data-state={playing ? 'playing' : 'paused'}
        />
      )}
    </S.Progress>
  )
}

function Duration({ children: dur }: { children: number }) {
  const txt =
    typeof dur !== 'number'
      ? ''
      : dur < 60
      ? `${dur}s`
      : dur < 60 ** 2
      ? `${Math.round(dur / 60)}m`
      : `${(dur / 60 ** 2) | 0}h ${((dur % 60 ** 2) / 60) | 0}m`

  return <S.Duration>{txt}</S.Duration>
}

const S = {
  Strip: styled.article.attrs<{ index: number }>(({ index }) => ({
    style: { top: `calc(${index} * var(--item-height))` },
  }))<{
    index: number
  }>`
    position: absolute;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;

    height: var(--item-height);
    padding: 0 1rem;

    @media (pointer: coarse) {
      user-select: none;
    }

    @media ${mobile} {
      display: unset;
      padding-right: 3rem;
      overflow-x: hidden;

      & > *:not(div) {
        flex-grow: unset;
        width: 100%;
        text-align: left;
        margin: 0;
      }

      span {
        font-size: 0.8rem;
      }
    }
  `,

  Title: styled.h1`
    flex-grow: 1;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    color: var(--cl-text-strong);
    min-height: 1.15em;
    line-height: 1.15em;

    @media ${mobile} {
      white-space: unset;
      /* stylelint-disable */
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;

      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      max-width: calc(100% - 4rem);
      font-size: 0.95rem;
    }
  `,

  Date: styled.span`
    flex-shrink: 0;
    opacity: 0.9;

    @media ${mobile} {
      position: absolute;
      top: 0.5rem;
    }
  `,

  Duration: styled.span`
    flex-shrink: 0;
    opacity: 0.9;
    text-align: right;
    min-width: 3rem;
    width: 5vw;
    margin-right: 3vw;

    @media ${mobile} {
      position: absolute;
      bottom: 0.5rem;
      left: 1rem;
    }
  `,

  Actions: styled.div`
    width: 2rem;
    flex-shrink: 0;

    @media ${mobile} {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
    }
  `,

  Play: styled.div`
    position: relative;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    transition: ${transition('0.15s ease', 'background-color', 'transform')};

    @media (hover: hover) {
      &:hover {
        background-color: var(--cl-primary);
        transform: scale(1.1);

        button > svg {
          fill: var(--cl-surface);
          transform: scale(1.2);
        }
      }
    }

    & > *,
    & > *[data-style] {
      ${center}
    }

    button > svg {
      fill: var(--cl-primary);
      transition: fill 0.15s ease, transform 0.3s ease;
    }
  `,

  Progress: styled.svg<{ progress: number; remaining: number }>`
    width: 100%;
    height: 100%;

    circle {
      fill: none;
      stroke-width: 8;
      stroke: var(--cl-primary);
    }

    circle[data-style='empty'] {
      opacity: 0.3;
    }

    circle:last-of-type {
      transform-origin: 50% 50%;
      transform: scaleX(-1) rotate(-90deg);
      stroke-dashoffset: ${({ progress }) => progress * circ};
      animation-fill-mode: forwards;

      &[data-state='playing'] {
        animation: ${({ remaining }) => remaining}s linear progress;
      }
    }

    @keyframes progress {
      to {
        stroke-dashoffset: ${circ};
      }
    }
  `,
}
