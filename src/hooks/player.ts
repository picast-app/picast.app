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

  useEffect(() => {
    if (!id) return
    let isInitial = true
    let cancelPlayState: (() => void) | undefined

    const set = (v: boolean) => {
      if (isInitial) initial.current = v
      else setPlaying(v)
    }

    const cancelCurrent = store.listenX('player.current', v => {
      if (v?.[1] !== id) {
        cancelPlayState?.()
        return set(false)
      }
      cancelPlayState = store.listenX('player.status', status =>
        set(status !== 'paused')
      )
    })

    isInitial = false

    return bundleSync(cancelCurrent, cancelPlayState)
  }, [id])

  return isPlaying ?? initial.current
}
