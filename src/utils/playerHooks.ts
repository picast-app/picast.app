import { useState, useEffect, useReducer } from 'react'
import { useSubscriptionValue } from 'utils/hooks'
import subscription from 'utils/subscription'
import { main } from 'workers'
import type { Player } from 'components/webcomponents'

const joinId = ([podId, epId]: [string, string]) => `${podId}-${epId}`
const compileCurrentId = (v: CurrentPlayback) =>
  !v ? null : joinId([v[0].id, v[1].id])

export const playerSub = subscription<Player | undefined>()
const currentIdSub = subscription(
  compileCurrentId(playerSub.state?.current ?? null)
)
export const isPlayingSub = subscription(false)
export const usePlayer = () => useSubscriptionValue(playerSub)

playerSub.subscribe(player => {
  if (!player) return
  const onPlay = () => isPlayingSub.setState(true)
  const onPause = () => isPlayingSub.setState(false)
  const onCurrent = (v: CurrentPlayback) =>
    currentIdSub.setState(compileCurrentId(v))

  player.addEventListener('play', onPlay)
  player.addEventListener('pause', onPause)
  player.addEventListener('current', onCurrent)

  return () => {
    player.removeEventListener('play', onPlay)
    player.removeEventListener('pause', onPause)
    player.removeEventListener('current', onCurrent)
  }
})
export const useIsPlaying = () => useSubscriptionValue(isPlayingSub)

export function useCurrent() {
  const player = useSubscriptionValue(playerSub)

  const [current, setCurrent] = useState<CurrentPlayback>(
    player?.current ?? null
  )

  useEffect(() => {
    if (!player) return
    player.addEventListener('current', setCurrent)
    return () => player.removeEventListener('current', setCurrent)
  }, [player])

  return current
}

export function useIsCurrent(id: EpisodeId) {
  const current = useSubscriptionValue(currentIdSub)
  const idStr = joinId(id)
  const [isPlaying, setIsPlaying] = useState(current === idStr)

  useEffect(() => {
    setIsPlaying(current === idStr)
  }, [current, idStr])

  return isPlaying
}

export function useEpisodePlaying(id: EpisodeId) {
  const isCurrent = useIsCurrent(id)
  const player = useSubscriptionValue(playerSub)
  const [isPlaying, setIsPlaying] = useState(
    !isCurrent ? false : player?.isPlaying() ?? false
  )

  useEffect(() => {
    if (!player || !isCurrent) {
      setIsPlaying(false)
      return
    }
    setIsPlaying(player.isPlaying())

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    player.addEventListener('play', onPlay)
    player.addEventListener('pause', onPause)
    return () => {
      player.removeEventListener('play', onPlay)
      player.removeEventListener('pause', onPause)
    }
  }, [isCurrent, player])

  return isPlaying
}

type EpisodeState = { progress: number; duration: number; _progAbs: number }
export function useEpisodeState(
  id: EpisodeId,
  initialProgress = 0
): EpisodeState {
  const isCurrent = useIsCurrent(id)
  const player = useSubscriptionValue(playerSub)

  const [state, update] = useReducer(
    (state: EpisodeState, update: Partial<EpisodeState>): EpisodeState => {
      const newState = { ...state }
      if ('progress' in update) newState._progAbs = update.progress!
      if ('duration' in update) newState.duration = update.duration!
      newState.progress = newState._progAbs / newState.duration

      return Object.keys(newState).some(
        k => (state as any)[k] !== (newState as any)[k]
      )
        ? newState
        : state
    },
    { progress: initialProgress, duration: 30, _progAbs: initialProgress * 30 }
  )

  const idStr = isCurrent ? joinId(id) : null
  useEffect(() => {
    if (!player || !idStr) return

    if (isFinite(player.duration)) update({ duration: player.duration })

    const onJump = (progress: number, id?: EpisodeId) => {
      if (!id || joinId(id) !== idStr) return
      update({ progress })
    }
    const onDuration = (duration: number, id?: EpisodeId) => {
      if (!id || joinId(id) !== idStr) return
      update({ duration })
    }
    const onToggle = () => update({ progress: player.time })

    player.addEventListener('jump', onJump)
    player.addEventListener('duration', onDuration)
    player.addEventListener('play', onToggle)
    player.addEventListener('pause', onToggle)

    return () => {
      player.removeEventListener('jump', onJump)
      player.removeEventListener('duration', onDuration)
      player.removeEventListener('play', onToggle)
      player.removeEventListener('pause', onToggle)
    }
  }, [player, idStr])

  return state
}

const toggle = ([pod, ep]: EpisodeId) => async () => {
  const player = playerSub.state

  if (pod !== player?.current?.[0]?.id || ep !== player?.current?.[1]?.id) {
    if (player) {
      await player.play([pod, ep])
    } else {
      const unsub = playerSub.subscribe(player => {
        if (!player) return
        player.resume()
        unsub()
      })
      await main.setPlaying([pod, ep])
    }
  } else {
    if (player.isPlaying()) player.pause()
    else await player.resume()
  }
}

export const useEpisodeToggle = (
  id: EpisodeId
): [playing: boolean, toggle: () => void] => [useEpisodePlaying(id), toggle(id)]
