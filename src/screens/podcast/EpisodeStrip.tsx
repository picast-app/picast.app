import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Icon } from 'components/atoms'
import { main } from 'workers'
import type { EpisodeBase } from 'main/store'
import { proxy } from 'comlink'
import { useTrackState } from 'utils/player'
import { useComputed } from 'utils/hooks'
import { mobile } from 'styles/responsive'

type Props = {
  feed: string
  index: number
}

export default function EpisodeStrip({ feed, index }: Props) {
  const episode = useEpisode(feed, index)
  const date = useComputed(episode?.published, format)

  return (
    <S.Strip index={index}>
      <S.Title>{episode?.title}</S.Title>
      <S.Date>{date}</S.Date>
      <S.Actions>
        <PlayButton
          file={episode?.file}
          id={[episode?.podcast, episode?.id] as any}
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
    <Icon
      icon={state === 'paused' ? 'play' : 'pause'}
      onClick={() => file && toggle(id, state)}
      label={state === 'paused' ? 'play' : 'pause'}
    />
  )
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
    style: { top: `calc(${index} * var(--height))` },
  }))<{
    index: number
  }>`
    position: absolute;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;

    --height: 3.8rem;
    --height: var(--item-height);
    height: var(--height);
    padding: 0 1rem;

    @media (pointer: coarse) {
      user-select: none;
    }

    @media ${mobile} {
      flex-direction: column-reverse;
      justify-content: space-around;
      padding-right: 3rem;

      & > *:not(div) {
        flex-grow: unset;
        width: 100%;
        text-align: left;
        margin: 0;
      }
    }
  `,

  Title: styled.h1`
    flex-grow: 1;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    color: var(--cl-text-strong);

    @media ${mobile} {
      white-space: unset;
      /* stylelint-disable */
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
  `,

  Date: styled.span`
    flex-shrink: 0;
    margin-right: 3vw;
    text-align: right;
    min-width: 7rem;
    opacity: 0.9;

    @media ${mobile} {
      font-size: 0.8rem;
    }
  `,

  Actions: styled.div`
    width: 2rem;

    @media ${mobile} {
      position: absolute;
      right: 0;
    }
  `,
}
