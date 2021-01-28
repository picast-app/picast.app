import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Icon } from 'components/atoms'
import { main } from 'workers'
import type { EpisodeBase } from 'main/store'
import { proxy } from 'comlink'
import { useTrackState } from 'utils/player'

type Props = {
  feed: string
  index: number
}

export default function EpisodeStrip({ feed, index }: Props) {
  const episode = useEpisode(feed, index)

  return (
    <S.Strip index={index}>
      <S.TextSec>{episode?.title}</S.TextSec>
      <PlayButton
        file={episode?.file}
        id={[episode?.podcast, episode?.id] as any}
      />
    </S.Strip>
  )
}

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
  Strip: styled.div<{ index: number }>`
    position: absolute;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;

    --height: 3.8rem;
    --height: var(--item-height);
    height: var(--height);
    top: calc(${({ index }) => index} * var(--height));
    padding: 0 1rem;

    @media (pointer: coarse) {
      user-select: none;
    }
  `,

  TextSec: styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
  `,

  Actions: styled.div`
    width: 2rem;
  `,
}
