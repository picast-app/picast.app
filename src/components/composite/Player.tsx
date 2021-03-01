import React from 'react'
import styled from 'styled-components'
import { Link, Artwork } from 'components/atoms'
import Controls from './player/Controls'
import { usePlaying } from 'utils/player'

export function Player() {
  const [podcast] = usePlaying()

  if (!podcast) return null
  return (
    <picast-player>
      <Controls slot="controls" />
      <Thumbnail to={`/show/${podcast?.id}`} slot="info">
        <Artwork
          src={podcast.artwork}
          title={podcast.title}
          covers={podcast.covers}
          sizes={[80]}
        />
      </Thumbnail>
    </picast-player>
  )
}

const Thumbnail = styled(Link)`
  --size: calc(var(--player-height) - 2.5rem);
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
`
