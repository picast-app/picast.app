import React, { useState } from 'react'
import styled from 'styled-components'
import { Input } from './atoms'

export default function Search() {
  const [input, setInput] = useState('')

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
