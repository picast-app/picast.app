import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Link } from '@picast-app/router'
import { Shownotes } from 'app/components/composite'
import { desktop, mobile } from 'app/styles/responsive'
import { ignore } from 'app/interaction/gesture/gestures'
import type { Podcast, Episode } from 'app/store/state'

interface Props {
  podcast: Podcast
  episode: Episode
  touchCtrl?: boolean
}

export function EpisodeInfo({ podcast, episode, touchCtrl }: Props) {
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref || !touchCtrl) return
    const player = ref.closest<HTMLElement>('picast-player')
    if (!player) return

    let playerY: number
    const updatePos = () => {
      const y = player.getBoundingClientRect().y
      if (playerY && !y) ref.style.overflowY = 'auto'
      if (y && !playerY) ref.style.overflowY = 'hidden'
      playerY = y
    }
    updatePos()

    const observer = new MutationObserver(updatePos)

    ref.addEventListener('touchmove', e => {
      if (!(e.currentTarget as HTMLElement).scrollTop || playerY) return
      e.stopPropagation()
      ignore(e.touches as any)
    })

    observer.observe(player, { attributes: true, attributeFilter: ['style'] })
    return () => observer.disconnect()
  }, [ref, touchCtrl])

  if (!podcast || !episode) return null
  return (
    <S.Container ref={setRef} onClick={e => e.stopPropagation()}>
      {podcast && episode && (
        <>
          <h1>{episode.title}</h1>
          <address>
            <Link to={`/show/${podcast.id}`}>{podcast.title}</Link>
          </address>
          <S.NoteContainer>
            <Shownotes id={[podcast.id, episode.id]} />
          </S.NoteContainer>
        </>
      )}
    </S.Container>
  )
}

const S = {
  Container: styled.article`
    padding: 1rem;

    h1 {
      color: var(--cl-text-strong);
      font-size: 1.41rem;
      font-weight: 300;
      line-height: 1.2;
      margin-bottom: 0.4em;
    }

    address {
      a {
        font-size: 0.95rem;
        font-weight: 500;
        color: var(--cl-primary);
        text-decoration: none;
      }
    }

    @media ${mobile} {
      overflow-y: auto;
    }
  `,

  NoteContainer: styled.div`
    @media ${desktop} {
      max-height: 50vh;
      overflow: hidden auto;
      margin-top: 2rem;
    }
  `,
}
