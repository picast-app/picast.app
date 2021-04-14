import React from 'react'
import styled from 'styled-components'
import { Link, Artwork, Icon } from 'components/atoms'
import { mobile } from 'styles/responsive'
import type { Podcast } from 'main/store/types'

interface Props {
  podcast: Podcast
}

export default function Info({ podcast }: Props) {
  return (
    <S.Container slot="info">
      <Icon icon="list" label="queue" linkTo="#queue" />
      <S.Thumbnail to={`/show/${podcast?.id}`} slot="info">
        <Artwork
          src={podcast.artwork}
          title={podcast.title}
          covers={podcast.covers}
          sizes={[80]}
        />
      </S.Thumbnail>
    </S.Container>
  )
}

const S = {
  Container: styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    box-sizing: border-box;
    --icon-size: 2.5rem;
    --size: calc(var(--player-height) - 2.5rem);

    & > a:first-of-type {
      margin-right: 2rem;
    }

    @media ${mobile} {
      position: absolute;
      width: 100%;
      justify-content: space-between;
      flex-direction: row-reverse;
      padding: 0 1rem;
      z-index: -1;
      --size: calc(var(--player-height) - 1.5rem);

      & > button {
        margin-right: unset;
      }
    }
  `,

  Thumbnail: styled(Link)`
    width: var(--size);
    height: var(--size);
    place-self: center end;
    margin-right: calc((var(--player-height) - var(--size)) / 2);
    border-radius: 0.25rem;
    overflow: hidden;
    transition: transform 0.2s ease;
    display: block;

    &:hover {
      transform: scale(1.05);
    }

    @media ${mobile} {
      pointer-events: none;
    }
  `,
}
