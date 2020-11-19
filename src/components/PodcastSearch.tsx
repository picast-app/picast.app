import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Input } from './atoms'
import { useDebouncedInputCall } from 'utils/hooks'
import { gql, useQuery } from 'gql'
import type * as T from 'gql/types'

const SEARCH_QUERY = gql`
  query SearchPodcast($query: String!) {
    search(query: $query) {
      id
      title
      author
      artwork
    }
  }
`

type Props = {
  onResults(results: T.SearchPodcast_search[], query: string): void
}

export default function Search({ onResults }: Props) {
  const [input, setInput] = useState('')
  const query = useDebouncedInputCall(input)

  const { data, variables } = useQuery<
    T.SearchPodcast,
    T.SearchPodcastVariables
  >(SEARCH_QUERY, {
    variables: { query },
    skip: !query,
  })

  useEffect(() => {
    if (!data?.search || !variables?.query) return
    onResults?.(data.search, variables.query)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <Input
      value={input}
      onChange={setInput}
      blend
      style={style}
      type="search"
    />
  )
}

const style = styled.input`
  height: 100%;
  width: 100%;
`
