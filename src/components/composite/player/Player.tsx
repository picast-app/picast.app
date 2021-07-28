import React from 'react'
import Controls from './Controls'
import Fullscreen from './fullscreen/Container'
import { useTheme, useStateX } from 'app/hooks'
import Info from './Info'

export function Player() {
  const theme = useTheme()
  return (
    <picast-player theme={theme}>
      <Content />
    </picast-player>
  )
}

function Content() {
  const [current] = useStateX('player.current')
  if (!current) return null
  return (
    <>
      <Controls slot="controls" />
      <Info podcast={current[0]} />
      <Fullscreen slot="fullscreen" id={current} />
    </>
  )
}
