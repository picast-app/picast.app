import React from 'react'
import styled from 'styled-components'
import Episode from './Episode'
import { desktop } from 'styles/responsive'
import { useEpisodes } from 'utils/hooks'

type Props = {
  id: string
  total: number
}

export default function Episodes({ id, total }: Props) {
  const episodes = useEpisodes(id)

  return (
    <S.Feed episodes={total ?? 100}>
      {episodes.map((node, i) => (
        <Episode key={node.id} {...node} index={i} />
      ))}
    </S.Feed>
  )
}

const S = {
  Feed: styled.ol<{ episodes: number }>`
    position: relative;

    @media ${desktop} {
      margin: 1rem 1.5rem;
    }

    height: calc(3.8rem * ${({ episodes }) => episodes});
  `,
}
