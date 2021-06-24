import { useCallback } from 'react'
import { main } from 'workers'
import { useStateX } from 'hooks/store'

export function useEpisodeToggle(
  episode: EpisodeId
): [playing: boolean, toggle: () => void] {
  const [current] = useStateX('player.current')
  const [status] = useStateX('player.status')

  return [
    status === 'playing' &&
      current?.[0] === episode[0] &&
      current?.[1] === episode[1],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useCallback(() => main.playEpisode(episode), episode),
  ]
}

type EpisodeState = { progress: number; duration: number; _progAbs: number }

export function useEpisodeState(
  id: EpisodeId,
  initialProgress = 0
): EpisodeState {
  return { progress: 0, duration: 100, _progAbs: 0 }
}

export function useCurrent(): CurrentPlayback {
  return null
}

export function useIsPlaying(): boolean {
  return false
}
