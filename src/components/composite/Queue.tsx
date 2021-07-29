import React from 'react'
import styled from 'styled-components'
// import { useAppState } from 'hooks'
import { EpisodeStrip } from 'components/composite'

export function Queue() {
  // const [queue] = useAppState<EpisodeId[]>('queue')
  const queue: any[] = []

  if (!queue) return null
  return (
    <S.Queue>
      {queue.map(id => (
        <S.Entry key={id[1]}>
          <EpisodeStrip id={id[1]} artwork clamp />
        </S.Entry>
      ))}
    </S.Queue>
  )
}

const S = {
  Queue: styled.ol`
    padding-top: 1rem;
  `,

  Entry: styled.li`
    width: 100%;
    height: 3.8rem;
  `,
}
