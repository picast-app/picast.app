import React, { useEffect } from 'react'
import styled from 'styled-components'
import { Surface } from 'components/structure'
import { bar } from 'styles/mixin'
import { desktop } from 'styles/responsive'
import { useTrack, usePlayState } from 'utils/player'

export function Player() {
  const [track, setTrack] = useTrack()
  const [, setPlayState] = usePlayState()
  const audio = document.querySelector('#player') as HTMLAudioElement

  useEffect(() => {
    if (!audio) return
    console.log('setup')

    const onPlay = () => {
      setPlayState('playing')
    }
    const onPause = () => {
      setPlayState('paused')
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [audio, setPlayState])

  useEffect(() => {
    const onPlay = async (e: Event) => {
      const { track = audio.src } = (e as EchoPlayEvent).detail
      if (!track) return
      if (track !== audio.src) {
        audio.src = track
        setTrack(track)
      }
      await audio.play()
    }

    const onPause = () => {
      audio.pause()
    }

    window.addEventListener('echo_play', onPlay)
    window.addEventListener('echo_pause', onPause)

    return () => {
      window.removeEventListener('echo_play', onPlay)
      window.removeEventListener('echo_pause', onPause)
    }
  }, [audio, setTrack])

  if (!track) return <div />
  return (
    <Surface sc={S.Player} el={4}>
      <S.PlayControls></S.PlayControls>
    </Surface>
  )
}

const S = {
  Player: styled.div`
    ${bar}
    display: block;
    bottom: var(--bar-height);
    height: var(--player-height);
    z-index: 9000;

    @media ${desktop} {
      bottom: 0;
    }
  `,

  PlayControls: styled.div`
    border: 1px dotted #f00;

    @media ${desktop} {
      position: absolute;
      width: var(--sidebar-width);
      height: 100%;
      transform: translateX(-100%);
    }
  `,
}

export const PlayerSC = S.Player
