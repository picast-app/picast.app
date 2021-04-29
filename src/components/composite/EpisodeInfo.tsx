import React from 'react'
import styled from 'styled-components'
import { Link } from '@picast-app/router'
import { Shownotes } from 'components/composite'
import type { Podcast, Episode } from 'main/store/types'

interface Props {
  podcast: Podcast
  episode: Episode
}

export function EpisodeInfo({ podcast, episode }: Props) {
  if (!podcast || !episode) return null
  return (
    <S.Container onClick={e => e.stopPropagation()}>
      {podcast && episode && (
        <>
          <h1>{episode.title}</h1>
          <address>
            <Link to={`/show/${podcast.id}`}>{podcast.title}</Link>
          </address>
          <S.NoteContainer>
            <Shownotes>{episode.shownotes}</Shownotes>
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
  `,

  NoteContainer: styled.div`
    max-height: 50vh;
    overflow: hidden auto;
    margin-top: 2rem;
  `,
}
