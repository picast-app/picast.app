import React from 'react'
import styled from 'styled-components'
import type * as T from 'gql/types'
import { desktop } from 'styles/responsive'

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

    --border: 1px solid var(--cl-border);

    &:not(:first-of-type) {
      border-top: var(--border);
    }

    @media ${desktop} {
      &:first-of-type {
        border-top: var(--border);
      }

      &:last-of-type {
        border-bottom: var(--border);
      }
    }
  `,

  Info: styled.div`
    display: flex;
  `,
}
