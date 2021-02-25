import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Icon } from 'components/atoms'
import { main } from 'workers'
import type { EpisodeBase } from 'main/store/types'
import { proxy } from 'comlink'
import { useTrackState } from 'utils/player'
import { useComputed } from 'utils/hooks'
import { mobile } from 'styles/responsive'
import { center } from 'styles/mixin'

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
          file={episode.file}
          id={[episode.podcast, episode.id] as any}
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

function PlayButton({ file, id }: { file?: string; id: EpisodeId }) {
  const state = useTrackState(file) ?? 'paused'
  return (
    <S.Play>
      <EpisodeProgress progress={0} />
      <Icon
        icon={state === 'paused' ? 'play' : 'pause'}
        onClick={() => file && toggle(id, state)}
        label={state === 'paused' ? 'play' : 'pause'}
      />
    </S.Play>
  )
}

const width = 8
const rad = 50 - width / 2

function EpisodeProgress({ progress }: { progress: number }) {
  return (
    <S.Progress viewBox="0 0 100 100">
      <circle
        cx={50}
        cy={50}
        r={rad}
        data-style={progress > 0 ? 'empty' : 'full'}
      />
      <ProgressArc progress={progress} />
    </S.Progress>
  )
}

function ProgressArc({ progress }: { progress: number }) {
  if (progress === 0 || progress === 1) return null

  const x = 50 + Math.sin(progress * Math.PI * 2) * rad
  const y = 50 + -Math.cos(progress * Math.PI * 2) * rad

  return (
    <path
      d={`M ${x} ${y} A ${rad} ${rad} 0 ${progress <= 0.5 ? 1 : 0} 1 50 ${
        width / 2
      }`}
    />
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

function toggle(episode: EpisodeId, state: 'playing' | 'paused') {
  if (!episode) return
  if (state === 'playing') window.dispatchEvent(new CustomEvent('echo_pause'))
  else
    window.dispatchEvent(
      new CustomEvent<EchoPlayEvent['detail']>('echo_play', {
        detail: { episode },
      })
    )
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

    & > *,
    & > *[data-style] {
      ${center}
    }

    svg {
      fill: var(--cl-primary);
    }
  `,

  Progress: styled.svg`
    width: 100%;
    height: 100%;

    circle,
    path {
      fill: none;
      stroke-width: 8;
      stroke: var(--cl-primary);
    }

    circle[data-style='empty'] {
      opacity: 0.3;
    }
  `,
}
