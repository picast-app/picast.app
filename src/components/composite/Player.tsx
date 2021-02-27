import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Artwork, Link } from 'components/atoms'
import { Surface } from 'components/structure'
import { bar } from 'styles/mixin'
import { desktop, mobile } from 'styles/responsive'
import { useTrack, usePlaying } from 'utils/player'
import { useTheme, useMatchMedia, useHistory } from 'utils/hooks'
import ProgressBar from './player/ProgressBar'
import Fullscreen from './player/Fullscreen'
import { animateTo } from 'utils/animate'
import Controls from './player/Controls'

export function Player() {
  const track = useTrack()
  const theme = useTheme()
  const history = useHistory()
  const isDesktop = useMatchMedia(desktop)
  const [fsState, setFsState] = useState(false)
  const [_fullscreen, setFullscreen] = useState(
    new URLSearchParams(location.search).get('view') === 'player'
  )
  const fullscreen = !isDesktop && _fullscreen
  const [podcast, episode] = usePlaying()

  // encode fullscreen state in url
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (!track) {
      if (!fsState) return
      params.delete('view')
      setFsState(false)
      history.push(
        `${location.pathname}?${params.toString()}`.replace(/\?$/, '')
      )
      return
    }
    if ((params.get('view') === 'player') === fsState) return
    if (fsState) params.set('view', 'player')
    else params.delete('view')
    history.push(`${location.pathname}?${params.toString()}`.replace(/\?$/, ''))
  }, [fsState, history, track])

  // react to history
  useEffect(() => {
    let last = new URLSearchParams(location.search).get('view') === 'player'
    return history.listen(({ search }) => {
      const qFull = new URLSearchParams(search).get('view') === 'player'
      if (qFull !== last) setFullscreen(qFull)
      last = qFull
    })
  }, [history])

  useEffect(() => {
    if (fsState === fullscreen) return
    setFsState(fullscreen)
    if (fullscreen) transition('in')
    else transition('out')
  }, [fullscreen, fsState])

  if (!track) return <div />
  return (
    <Surface
      sc={S.Player}
      el={4}
      alt={isDesktop && theme === 'light'}
      onClick={({ target, currentTarget }: any) => {
        if (isDesktop) return
        if (target !== currentTarget) return
        setFullscreen(true)
      }}
      id="player-container"
    >
      <Controls />
      <S.Central>
        {isDesktop && <S.Title>{episode?.title}</S.Title>}
        <ProgressBar barOnly={!isDesktop} />
      </S.Central>
      {isDesktop && (
        <S.Right>
          <S.Thumbnail to={`/show/${podcast?.id}`}>
            <Artwork
              src={podcast?.artwork}
              title={podcast?.title}
              covers={podcast?.covers}
              sizes={[80]}
            />
          </S.Thumbnail>
        </S.Right>
      )}
      <Fullscreen
        onHide={() => {
          setFullscreen(false)
        }}
      />
    </Surface>
  )
}

function transition(dir: 'in' | 'out') {
  const player = document.getElementById('player-container')
  const fullscreen = document.getElementById('fullscreen-player')
  const mainnav = document.getElementById('mainnav')

  if (!player || !mainnav || !fullscreen) return

  const duration = 250
  const opts = { duration, easing: 'ease-out' }

  if (dir === 'in') {
    mainnav.style.zIndex = '13000'
    mainnav.style.pointerEvents = 'none'
    fullscreen.style.pointerEvents = 'all'
    ;(fullscreen.parentElement as HTMLElement).dataset.state = 'visible'
    animateTo(
      player,
      { transform: `translateY(-${player.getBoundingClientRect().top}px)` },
      opts
    )
    animateTo(fullscreen, { transform: 'translateY(0)' }, opts)
    animateTo(fullscreen, { opacity: 1 }, { duration: duration / 4 })
    animateTo(mainnav, { transform: 'translateY(100%)' }, opts)
  } else {
    fullscreen.style.pointerEvents = 'none'
    animateTo(player, { transform: 'translateY(0)' }, opts)
    animateTo(fullscreen, { transform: 'translateY(var(--bar-height))' }, opts)
    animateTo(
      fullscreen,
      { opacity: 0 },
      { duration: duration / 4, delay: (duration / 4) * 3 }
    )
    animateTo(mainnav, { transform: 'translateY(0)' }, opts, () => {
      mainnav.style.zIndex = '9001'
      mainnav.style.pointerEvents = ''
      ;(fullscreen.parentElement as HTMLElement).dataset.state = 'hidden'
    })
  }
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
    transform: translateY(0);

    @media ${desktop} {
      bottom: 0;

      &::before {
        content: '';
        display: block;
        background-color: inherit;
        position: absolute;
        left: -0.5rem;
        top: 0;
        width: 0.5rem;
        height: 100%;
      }
    }

    @media ${mobile} {
      z-index: 9002;
    }
  `,

  Central: styled.div`
    width: calc(100% - 2rem);
    display: flex;

    @media ${mobile} {
      position: absolute;
      bottom: -3px;
      width: 100%;
    }

    @media ${desktop} {
      flex-direction: column;
      justify-content: space-around;
      align-items: center;
      height: 100%;
      padding-top: 0.5rem;
    }
  `,

  Title: styled.span`
    font-size: 1.1rem;
    color: var(--cl-text-strong);
  `,

  Right: styled.div`
    width: var(--sidebar-width);
    flex-shrink: 0;
    height: 100%;
    padding-right: 1.25rem;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  `,

  Thumbnail: styled(Link)`
    --size: calc(var(--player-height) - 2.5rem);
    width: var(--size);
    height: var(--size);
    border-radius: 0.25rem;
    overflow: hidden;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }
  `,
}

export const PlayerSC = S.Player
