import { useState, useEffect, useRef } from 'react'
import { bundleSync } from 'utils/function'
import store from 'store/uiThread/api'

type EpisodeState = { progress: number; duration: number; _progAbs: number }

export function useEpisodeState(
  id: EpisodeId,
  initialProgress = 0
): EpisodeState {
  return { progress: 0, duration: 100, _progAbs: 0 }
}

export function useIsEpisodePlaying([, id]: EpisodeId) {
  const [isPlaying, setPlaying] = useState<boolean>()
  const initial = useRef(false)

  // yes, all of this just exists to prevent unnecessary renders
  useEffect(() => {
    let isIntitial = true
    let stopStatus: (() => void) | undefined

    const set = (v: boolean) => {
      if (initial.current === v) return false
      initial.current = v
      if (!isIntitial) setPlaying(v)
      return true
    }

    const unsub = store.listenX('player.current', v => {
      if (v?.[1] !== id) if (!set(false)) return
      stopStatus?.()
      if (v?.[1] === id)
        stopStatus = store.listenX('player.status', status => {
          set(status !== 'paused')
        })
    })

    isIntitial = false
    return bundleSync(unsub, stopStatus)
  }, [id])

  return isPlaying ?? initial.current
}
