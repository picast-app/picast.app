import React, { useEffect } from 'react'
import styled from 'styled-components'
import { Icon } from 'components/atoms'
import { Surface } from 'components/structure'
import { bar, center } from 'styles/mixin'
import { desktop, mobile } from 'styles/responsive'
import { useTrack, usePlayState, trackSub } from 'utils/player'
import { useTheme, useMatchMedia } from 'utils/hooks'
import ProgressBar from './player/ProgressBar'

const audio = document.querySelector('#player') as HTMLAudioElement
audio.volume = 0.4

async function play(track?: string) {
  if (track && track !== audio.src) {
    audio.src = track
    trackSub.setState(track)
  }
  if (!audio.src) return
  await audio.play()
}

export function Player() {
  const [track, setTrack] = useTrack()
  const [playState, setPlayState] = usePlayState()
  const theme = useTheme()
  const isDesktop = useMatchMedia(desktop)

  useEffect(() => {
    if (!audio) return

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
  }, [setPlayState])

  useEffect(() => {
    const onPlay = async (e: Event) => {
      const { track = audio.src } = (e as EchoPlayEvent).detail
      await play(track)
    }

    const onPause = () => {
      audio.pause()
    }

    const onJump = (e: Event) => {
      audio.currentTime = (e as EchoJumpEvent).detail.location
    }

    window.addEventListener('echo_play', onPlay)
    window.addEventListener('echo_pause', onPause)
    window.addEventListener('echo_jump', onJump)

    return () => {
      window.removeEventListener('echo_play', onPlay)
      window.removeEventListener('echo_pause', onPause)
      window.removeEventListener('echo_jump', onJump)
    }
  }, [setTrack])

  if (!track) return <div />
  return (
    <Surface sc={S.Player} el={4} alt={isDesktop && theme === 'light'}>
      <S.PlayControls>
        <Icon
          icon={playState === 'paused' ? 'play' : 'pause'}
          label={playState === 'paused' ? 'play' : 'pause'}
          onClick={playState === 'paused' ? () => play() : () => audio.pause()}
        />
      </S.PlayControls>
      <S.Main>
        <ProgressBar barOnly={!isDesktop} />
      </S.Main>
    </Surface>
  )
}

const S = {
  Player: styled.div`
    ${bar}
    bottom: var(--bar-height);
    height: var(--player-height);
    z-index: 9000;
    display: flex;
    justify-content: space-around;
    align-items: center;

    @media ${desktop} {
      bottom: 0;
    }

    @media ${mobile} {
      z-index: 9002;
    }
  `,

  PlayControls: styled.div`
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: fixed;
    z-index: 9000;

    --pb-size: 2.5rem;

    button[data-style~='icon-wrap'] {
      background-color: var(--cl-text);
      width: var(--pb-size);
      height: var(--pb-size);
      border-radius: 50%;
      position: relative;
    }

    svg {
      fill: var(--cl-surface);
      width: 80%;
      height: 80%;
      ${center}
    }

    @media ${desktop} {
      position: absolute;
      width: var(--sidebar-width);
      height: 100%;
      left: 0;
      transform: translateX(-100%);

      --pb-size: 4rem;

      button[data-style~='icon-wrap'] {
        background-color: transparent;
      }

      svg {
        fill: var(--cl-text);
      }
    }

    @media ${mobile} {
      ${center}
    }
  `,

  Main: styled.div`
    width: calc(100% - 2rem);
    display: flex;

    @media ${mobile} {
      position: absolute;
      bottom: -3px;
      width: 100%;
    }
  `,
}

export const PlayerSC = S.Player
