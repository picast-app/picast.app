import React from 'react'
import Controls from './player/Controls'
import Fullscreen from './player/fullscreen/Container'
import { useTheme } from 'hooks'
import { useCurrent } from 'utils/playerHooks'
import Info from './player/Info'

export function Player() {
  const current = useCurrent()
  const theme = useTheme()

  return (
    <picast-player theme={theme}>
      {current && (
        <>
          <Controls slot="controls" />
          <Info podcast={current[0]} />
          <Fullscreen
            slot="fullscreen"
            podcast={current[0]}
            episode={current[1]}
          />
        </>
      )}
    </picast-player>
  )
}
