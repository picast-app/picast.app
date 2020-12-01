import { useSubscription } from 'utils/hooks'
import createSub from 'utils/subscription'

const audio = document.querySelector('#player') as HTMLAudioElement
audio.volume = 0.4

export const trackSub = createSub<string>()
export const useTrack = () => useSubscription(trackSub)[0]

type PlayState = 'playing' | 'paused'

export const playState = createSub<PlayState>()
export const usePlayState = () => useSubscription(playState)[0]

export function useTrackState(episode: string): PlayState {
  const state = usePlayState()
  const track = useTrack()
  return track === episode ? state : 'paused'
}

export async function play(track?: string) {
  if (track && track !== audio.src) {
    audio.src = track
    trackSub.setState(track)
  }
  if (!audio.src) return
  if (playState.state !== 'playing') playState.setState('playing')
  await audio.play()
}

export function pause() {
  if (playState.state !== 'paused') playState.setState('paused')
  audio.pause()
}

export async function togglePlay() {
  if (playState.state === 'paused') await play()
  else pause()
}

window.addEventListener('echo_play', async (e: Event) => {
  const { track = audio.src } = (e as EchoPlayEvent).detail
  await play(track)
})
window.addEventListener('echo_pause', pause)
window.addEventListener('echo_jump', (e: Event) => {
  audio.currentTime = (e as EchoJumpEvent).detail.location
})
