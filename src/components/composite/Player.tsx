import React from 'react'
import Controls from './player/Controls'
import { useAppState } from 'utils/hooks'

export function Player() {
  const active = useHasActive()
  if (!active) return null
  return (
    <picast-player>
      <Controls slot="controls" />
    </picast-player>
  )
}

function useHasActive() {
  const [id] = useAppState('playing.id')
  return !!id
}
