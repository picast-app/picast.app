import React from 'react'
import { Screen } from 'components/structure'
import Appbar from 'components/Appbar'
import { gql, useQuery } from 'gql'
import type { RouteComponentProps } from 'react-router'
import type * as T from 'gql/types'
import Info from './podcast/Info'
import Feed from './podcast/Episodes'

const QUERY_SHOW = gql`
  query PodcastPage($id: ID!) {
    podcast(id: $id) {
      id
      title
      author
      description
      artwork
      episodes {
        id
        title
        publishDate
      }
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
      <Info {...podcast} />
      <Feed episodes={podcast.episodes ?? []} />
    </Screen>
  )
}
