import React from 'react'
import Controls from './player/Controls'
import Fullscreen from './player/fullscreen/Container'
import { useTheme } from 'utils/hooks'
import { usePlaying } from 'utils/player'
import Info from './player/Info'

export function Player() {
  const [podcast, episode] = usePlaying()
  const theme = useTheme()

  return (
    <picast-player theme={theme}>
      {podcast && episode && (
        <>
          <Controls slot="controls" />
          <Info podcast={podcast} />
          <Fullscreen slot="fullscreen" {...{ podcast, episode }} />
        </>
      )}
    </picast-player>
  )
}
