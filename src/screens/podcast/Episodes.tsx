import React, { useEffect } from 'react'
import styled from 'styled-components'
import Episode from './Episode'
import { desktop } from 'styles/responsive'
import { useEpisodes } from 'utils/hooks'

type Props = {
  id: string
  total: number
  onLoading(v: boolean): void
}

export default function Episodes({ id, total, onLoading }: Props) {
  const episodes = useEpisodes(id)
  const hasEpisodes = (episodes?.length ?? 0) > 0

  useEffect(() => {
    onLoading(!hasEpisodes)
  }, [hasEpisodes, onLoading])

  return (
    <S.Feed episodes={total ?? 10}>
      {episodes.map((node, i) => (
        <Episode key={node.id} {...node} index={i} podcast={id} />
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
