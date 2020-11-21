import { useSubscription } from 'utils/hooks'
import createSub from 'utils/subscription'

export const trackSub = createSub<string>()
export const useTrack = () => useSubscription(trackSub)

type PlayState = 'playing' | 'paused'

export const playState = createSub<PlayState>()
export const usePlayState = () => useSubscription(playState)

export function useTrackState(episode: string): PlayState {
  const [state] = usePlayState()
  const [track] = useTrack()
  return track === episode ? state : 'paused'
}
