import React from 'react'
import styled from 'styled-components'
import type * as T from 'gql/types'
import Episode from './Episode'
import { desktop } from 'styles/responsive'

type Props = {
  episodes: T.PodcastPage_podcast_episodes
}

export default function Episodes({ episodes }: Props) {
  if (!episodes?.edges) return null
  return (
    <S.Feed episodes={episodes.pageInfo?.total ?? 100}>
      {episodes.edges.map(({ node }) => (
        <Episode key={node.id} {...node} />
      ))}
    </S.Feed>
  )
}

const S = {
  Feed: styled.ol<{ episodes: number }>`
    @media ${desktop} {
      margin: 1rem 1.5rem;
    }

    height: calc(3.8rem * ${({ episodes }) => episodes});
  `,
}
