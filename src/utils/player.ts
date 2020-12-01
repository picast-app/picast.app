import { useSubscription } from 'utils/hooks'
import createSub from 'utils/subscription'
import { main } from 'workers'

const audio = document.querySelector('#player') as HTMLAudioElement
audio.volume = 0.4

export const trackSub = createSub<string | null>()
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

async function setEpisode(epId: EpisodeId) {
  const [podcast, episode] = await Promise.all([
    main.podcast(epId[0]),
    main.episode(epId),
  ])
  if (!episode) throw Error("couldn't find episode " + epId.join(', '))
  playing.setState([podcast, episode])
  trackSub.setState(episode.file)
  audio.src = episode.file
  main.setPlaying(epId)
}

export async function play(epId?: EpisodeId) {
  if (epId) await setEpisode(epId)
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
  startProgressSync()
})
window.addEventListener('echo_pause', pause)
window.addEventListener('echo_jump', (e: Event) => {
  audio.currentTime = (e as EchoJumpEvent).detail.location
})
window.addEventListener('echo_skip', (e: Event) => {
  audio.currentTime += (e as EchoSkipEvent).detail.seconds
})

audio.addEventListener('ended', () => {
  playState.setState('paused')
  trackSub.setState(null)
  main.setPlaying(null)
})

const syncEvents = ['seeked', 'play', 'pause']
syncEvents.forEach(event => {
  audio.addEventListener(event, () => {
    main.setProgress(audio.currentTime)
  })
})

let psId: number
function startProgressSync() {
  clearTimeout(psId)
  main.setProgress(audio.currentTime)
  psId = setTimeout(startProgressSync, 5000)
}

const stopSyncEvents = ['pause', 'ended']
stopSyncEvents.forEach(event => {
  audio.addEventListener(event, () => {
    clearTimeout(psId)
  })
})

self.addEventListener(
  'onpagehide' in self ? 'pagehide' : 'unload',
  () => {
    main.setProgress(audio.currentTime)
  },
  { capture: true }
)

Promise.all([main.playing(), main.progress()]).then(
  async ([episode, progress]) => {
    if (trackSub.state || !episode) return
    playState.setState('paused')
    await setEpisode(episode)
    if (progress) audio.currentTime = progress
  }
)
