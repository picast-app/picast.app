import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Input } from './atoms'
import { useDebouncedInputCall, useHistory } from 'utils/hooks'

type Props = {
  visual?: boolean
}

export default function Search({ visual }: Props) {
  const [input, setInput] = useState(
    new URLSearchParams(location.search).get('q') ?? ''
  )
  const [lastQuery, setLastQuery] = useState(input)
  const query = useDebouncedInputCall(input)
  const history = useHistory()

  useEffect(() => {
    if (!query && !lastQuery) return
    const params = new URLSearchParams(location.search)
    if (query) params.set('q', query)
    else params.delete('q')
    const to = `/search?${params.toString()}`.replace(/\?$/, '')
    if (
      to === location.pathname + location.search ||
      (!query && location.pathname !== '/search')
    )
      return
    if (location.pathname === '/search') history.replace(to)
    else history.push(to)
    setLastQuery(query)
  }, [query, lastQuery, history])

  return (
    <Input
      value={input}
      onChange={setInput}
      blend={!visual}
      style={style}
      type="search"
    />
  )
}

const style = styled.input`
  height: 100%;
  width: 100%;
`
