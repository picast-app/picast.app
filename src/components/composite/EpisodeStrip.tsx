import React, { useState, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { Icon, Artwork } from 'components/atoms'
import { Link } from '@picast-app/router'
import { main } from 'workers'
import type { EpisodeBase } from 'main/store/types'
import { proxy } from 'comlink'
import { mobile } from 'styles/responsive'
import { center, transition } from 'styles/mixin'
import { useArtwork } from 'utils/hooks'
import { useEpisodeState, useEpisodeToggle } from 'utils/playerHooks'

type Props = (
  | {
      feed: string
      index: number
    }
  | { id: EpisodeId }
) & { artwork?: boolean; clamp?: boolean }

export function EpisodeStrip({ artwork, clamp, ...props }: Props) {
  const episode = useEpisode(props)

  if (!episode) return null
  return (
    <S.Strip>
      <Link to={`?info=${episode.podcast}-${episode.id}`}>
        {artwork && episode?.podcast && <Thumbnail podcast={episode.podcast} />}
        <S.Title data-style={clamp ? 'clamp' : undefined}>
          {episode.title}
        </S.Title>
        <Published>{episode.published}</Published>
        <Duration>{episode.duration}</Duration>
        <S.Actions
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <PlayButton
            id={[episode.podcast, episode.id] as any}
            progress={episode.relProg ?? 0}
          />
        </S.Actions>
      </Link>
    </S.Strip>
  )
}

function Thumbnail({ podcast }: { podcast: string }) {
  const covers = useArtwork(podcast)
  return <Artwork covers={covers} />
}

function useEpisode(
  props: { feed: string; index: number } | { id: EpisodeId }
) {
  const [episode, setEpisode] = useState<EpisodeBase>()

  const { feed, index, id: [pod, ep] = [] } = props as any
  useEffect(() => {
    let cancelled = false
    const cb = (v: EpisodeBase | null) => {
      if (!cancelled && v) setEpisode(v)
    }

    const cancel =
      'feed' in props
        ? getEpisodeFromFeed(props, cb)
        : getEpisodeFromId(props, cb)

    return () => {
      cancelled = true
      if (typeof cancel === 'function') cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed, index, pod, ep])

  return episode
}

type EpGetter<T> = (props: T, cb: (v: EpisodeBase | null) => void) => any

const getEpisodeFromFeed: EpGetter<{ feed: string; index: number }> = (
  { feed, index },
  cb
) => {
  const unsub = new Promise<() => void>(async res => {
    res((await main.feedItem(feed, index, proxy(cb))) as any)
  })
  return async () => (await unsub)?.()
}

const getEpisodeFromId: EpGetter<{ id: EpisodeId }> = async ({ id }, cb) =>
  cb(await main.episode(id))

function PlayButton({ id, progress }: { id: EpisodeId; progress: number }) {
  const [playing, toggle] = useEpisodeToggle(id)
  return (
    <S.Play>
      <EpisodeProgress episode={id} initial={progress} playing={playing} />
      <Icon
        icon={playing ? 'pause' : 'play'}
        label={playing ? 'pause' : 'play'}
        onClick={toggle}
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
  playing,
}: {
  episode: EpisodeId
  initial: number
  playing: boolean
}) {
  const { progress, duration } = useEpisodeState(episode, initial)
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

  return <S.Duration hidden={!dur}>{txt}</S.Duration>
}

const { format } = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function Published({ children: time }: { children: number }) {
  const date = useMemo(() => formatDate(time), [time])

  return <S.Date>{date}</S.Date>
}

function formatDate(raw: number) {
  return format(raw)
}

const S = {
  Strip: styled.article`
    height: 100%;

    @media (hover: hover) {
      &:hover * {
        color: var(--cl-primary);
      }
    }

    @media (pointer: coarse) {
      user-select: none;
    }

    & > a {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      text-decoration: none;
      height: 100%;
      padding: 0 1rem;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
      }

      picture {
        width: 3rem;
        height: 3rem;
        background-color: var(--cl-text-disabled);
        border-radius: 0.2rem;
        margin-right: 1rem;
        overflow: hidden;

        & > * {
          width: 100%;
          height: 100%;
        }
      }

      @media ${mobile} {
        display: block;
        padding-right: 3rem;
        overflow-x: hidden;
        position: relative;

        & > *:not(div, picture) {
          flex-grow: unset;
          width: calc(100% - 5rem);
          text-align: left;
          margin: 0;
          max-width: calc(100% - 4rem);
        }

        span,
        time {
          font-size: 0.8rem;
        }

        picture {
          position: absolute;
          left: 1rem;
          top: calc(50% - 1.5rem);
        }

        picture ~ :is(h1, time, span) {
          left: 4.5rem;
          max-width: calc(100% - 8rem);
        }
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
    margin-right: 1rem;

    a {
      text-decoration: none;
      color: inherit;
    }

    @media ${mobile} {
      &:not([data-style='clamp']) {
        white-space: unset;
        /* stylelint-disable */
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      position: absolute;
      top: 50%;
      left: 1rem;
      transform: translateY(-50%);
      font-size: 0.95rem;
    }
  `,

  Date: styled.time`
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
    width: 7vw;
    min-width: 5rem;
    margin-right: 3vw;
    white-space: nowrap;

    &[hidden] {
      display: initial;
      visibility: hidden;
    }

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
      right: 1rem;
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
