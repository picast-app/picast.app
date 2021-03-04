import React from 'react'
import Controls from './player/Controls'
import Fullscreen from './player/Fullscreen'
import { useTheme } from 'utils/hooks'
import { usePlaying } from 'utils/player'
import Info from './player/Info'

export function Player() {
  const [podcast, episode] = usePlaying()
  const theme = useTheme()

  if (!podcast || !episode) return null
  return (
    <picast-player theme={theme}>
      <Controls slot="controls" />
      <Info podcast={podcast} />
      <Fullscreen slot="fullscreen" {...{ podcast, episode }} />
    </picast-player>
  )
}
