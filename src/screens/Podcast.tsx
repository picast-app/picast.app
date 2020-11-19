import React from 'react'
import styled from 'styled-components'
import { Screen } from 'components/structure'
import Appbar from 'components/Appbar'
import { lineClamp } from 'styles/mixin'
import { gql, useQuery } from 'gql'
import type { RouteComponentProps } from 'react-router'
import type * as T from 'gql/types'

const QUERY_SHOW = gql`
  query PodcastPage($id: ID!) {
    podcast(id: $id) {
      id
      title
      author
      description
      artwork
    }
  }
`

export default function Podcast({
  match,
}: RouteComponentProps<{ id: string }>) {
  const { data, loading } = useQuery<T.PodcastPage>(QUERY_SHOW, {
    variables: match.params,
  })
  const podcast: Partial<T.PodcastPage_podcast> = data?.podcast ?? {}

  return (
    <Screen loading={loading}>
      <Appbar title={podcast.title} back="/" />
      <S.ShowCase>
        <div>
          <h1>{podcast.title}</h1>
          <span>{podcast.author}</span>
        </div>
        <img src={podcast.artwork as string} alt="artwork" />
      </S.ShowCase>
    </Screen>
  )
}

const S = {
  ShowCase: styled.div`
    display: flex;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--cl-text-disabled);

    img {
      height: 7rem;
      width: 7rem;
      border-radius: 0.5rem;
      margin-left: 1rem;
    }

    h1 {
      font-size: 1.3rem;
      line-height: 1.4;
      ${lineClamp(2)}
    }

    span {
      display: block;
      margin-top: 1rem;
      color: var(--cl-primary);
    }
  `,

  Actions: styled.div``,
}
