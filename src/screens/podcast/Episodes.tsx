import React from 'react'
import styled from 'styled-components'
import type * as T from 'gql/types'
import Episode from './Episode'
import { desktop } from 'styles/responsive'

type Props = {
  episodes: T.PodcastPage_podcast_episodes[]
}

export default function Episodes({ episodes }: Props) {
  return (
    <S.Feed>
      {episodes.map(v => (
        <Episode key={v.id} {...v} />
      ))}
    </S.Feed>
  )
}

const S = {
  Feed: styled.ol`
    @media ${desktop} {
      margin: 1rem 1.5rem;
    }
  `,
}
