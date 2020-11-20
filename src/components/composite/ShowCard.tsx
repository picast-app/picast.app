import React from 'react'
import styled from 'styled-components'
import { Artwork, Link } from 'components/atoms'
import { lineClamp } from 'styles/mixin'

type Podcast = {
  id: string
  title: string
  author: string | null
  artwork: string | null
}

type Props = {
  podcast: Podcast
  card?: boolean
  strip?: boolean
  title?: boolean
  author?: boolean
}

export function ShowCard({
  podcast,
  strip,
  card = !strip,
  title = false,
  author = title,
}: Props) {
  console.assert(!!card !== !!strip)
  const container = (
    <S.Container data-style={card ? 'card' : 'strip'}>
      <Artwork src={podcast.artwork ?? ''} title={podcast.title} />
      {(title || author) && (
        <S.Info>
          {title && <h1>{podcast.title}</h1>}
          {author && <span>{podcast.author}</span>}
        </S.Info>
      )}
    </S.Container>
  )
  return (
    <Link wrap to={`/show/${podcast.id}`}>
      {container}
    </Link>
  )
}

const S = {
  Container: styled.article`
    &[data-style='card'] {
      width: 12rem;

      & > img {
        width: 100%;
      }

      li & {
        width: 100%;
      }
    }

    &[data-style='strip'] {
      display: flex;
      padding: 0.5rem;
      height: 5rem;

      img {
        margin-right: 1rem;
        width: 4rem;
      }
    }
  `,

  Info: styled.div`
    * {
      margin-top: 0.2rem;
      line-height: 1.4;
      font-size: 0.8rem;
      height: unset;
      ${lineClamp(1)}
    }

    span {
      margin-top: 0;
      opacity: 0.7;
    }
  `,
}
