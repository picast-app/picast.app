import React from 'react'
import { Screen } from 'components/structure'
import DocTree from 'components/DocTree'
import { gql, useQuery } from 'gql'
import { useComputed } from 'utils/hooks'

const FETCH_FEED = gql`
  query FetchFeed($url: String!) {
    feed(url: $url) {
      raw
    }
  }
`

export default function FeedView() {
  const url = location.href.slice(`${location.origin}/feedview/`.length)
  const { data, loading } = useQuery(FETCH_FEED, { variables: { url } })
  const raw = data?.feed?.raw
  const document = useComputed(raw, txt =>
    new DOMParser().parseFromString(txt, 'text/xml')
  )

  if (loading) return <span>loading</span>
  return <Screen padd>{document && <DocTree document={document} />}</Screen>
}
