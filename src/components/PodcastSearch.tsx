import React, { useState } from 'react'
import styled from 'styled-components'
import { Input } from './atoms'
import { useDebouncedInputCall } from 'utils/hooks'
import { gql, useQuery } from 'gql'

const SEARCH_QUERY = gql`
  query SeachPodcast($query: String!) {
    search(query: $query) {
      id
      title
      author
      artwork
    }
  }
`

export default function Search() {
  const [input, setInput] = useState('')
  const query = useDebouncedInputCall(input)

  const { data } = useQuery(SEARCH_QUERY, {
    variables: { query },
    skip: !query,
  })

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
