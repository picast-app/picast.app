import React from 'react'
import Appbar from 'components/Appbar'
import { Screen } from 'components/structure'

export default function Library() {
  return (
    <Screen>
      <Appbar title="Podcasts" scrollOut />
      {Array(100)
        .fill(0)
        .map((_, i) => (
          <div key={i}>line {i + 1}</div>
        ))}
    </Screen>
  )
}
