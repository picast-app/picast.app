import React from 'react'
import styled from 'styled-components'
import Appbar from 'components/Appbar'
import Screen from 'components/Screen'

export default function Library() {
  return (
    <Screen>
      <Appbar title="Podcasts" />
      {Array(100)
        .fill(0)
        .map((_, i) => (
          <div key={i}>line {i + 1}</div>
        ))}
    </Screen>
  )
}

const S = {
  Placeholder: styled.div`
    height: 200vh;
  `,
}
