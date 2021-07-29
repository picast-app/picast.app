import React from 'react'
import styled from 'styled-components'
import { Artwork, Icon } from 'components/atoms'
import { Volume } from 'components/composite'
import { Link } from '@picast-app/router'
import { mobile, desktop } from 'styles/responsive'
import { useStateX } from 'hooks'

interface Props {
  podcast: string
}

export default function Info({ podcast: podId }: Props) {
  const [podcast] = useStateX('podcasts.*', podId)

  if (!podcast) return null
  return (
    <S.Container slot="info">
      <Volume />
      <Icon icon="list" label="queue" linkTo="#queue" />
      <S.Thumbnail to={`/show/${podcast.id}`} slot="info">
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

      & > *:first-child {
        display: none;
      }
    }

    @media ${desktop} {
      --padd-side: calc((var(--player-height) - var(--size)) / 2);
      padding: 0 var(--padd-side);
      justify-content: space-between;

      & > * {
        flex-shrink: 0;
      }
    }
  `,

  Thumbnail: styled(Link)`
    width: var(--size);
    height: var(--size);
    place-self: center end;
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
