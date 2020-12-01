import { useEffect } from 'react'
import { useSubscription } from 'utils/hooks'
import createSub from 'utils/subscription'
import { main } from 'workers'

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

const playing = createSub<[Podcast, EpisodeMin]>()
export const usePlaying = () => useSubscription(playing)[0]

export async function play(epId?: EpisodeId) {
  if (epId) {
    // const podcast = await main.podcast(epId[0])
    // const episode = await main.episode(epId)
    const [podcast, episode] = await Promise.all([
      main.podcast(epId[0]),
      main.episode(epId),
    ])
    if (!episode) throw Error("couldn't find episode " + epId.join(', '))
    playing.setState([podcast, episode])
    trackSub.setState(episode.file)
    audio.src = episode.file
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
  const { episode } = (e as EchoPlayEvent).detail
  await play(episode)
})
window.addEventListener('echo_pause', pause)
window.addEventListener('echo_jump', (e: Event) => {
  audio.currentTime = (e as EchoJumpEvent).detail.location
})
