import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Input } from './atoms'
import { useDebouncedInputCall } from 'utils/hooks'
import { useLocation, history } from '@picast-app/router'

type Props = {
  visual?: boolean
}

export default function Search({ visual }: Props) {
  const { path, search } = useLocation()
  const pathRef = useRef(path)
  pathRef.current = path
  const [input, setInput] = useState(new URLSearchParams(search).get('q') ?? '')
  const [lastQuery, setLastQuery] = useState(input)
  const query = useDebouncedInputCall(input)

  useEffect(() => {
    if (!query && !lastQuery) return
    const params = new URLSearchParams(location.search)
    if (query) params.set('q', query)
    else params.delete('q')
    const to = `/search?${params.toString()}`.replace(/\?$/, '')
    if (
      to === pathRef.current + location.search ||
      (!query && pathRef.current !== '/search')
    )
      return
    history.push(to, { replace: pathRef.current === '/search' })
    setLastQuery(query)
  }, [query, lastQuery])

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
