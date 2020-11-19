import React from 'react'
import styled from 'styled-components'
import type * as T from 'gql/types'

export default function Episode({ title }: T.PodcastPage_podcast_episodes) {
  return (
    <S.Episode>
      <article>
        <h1>{title}</h1>
      </article>
    </S.Episode>
  )
}

const S = {
  Episode: styled.li`
    article {
      height: 5rem;
      display: flex;
      padding: 0.5rem;
    }

    &:not(:first-of-type) {
      border-top: 1px solid var(--cl-border);
    }
  `,

  Info: styled.div`
    display: flex;
  `,
}
