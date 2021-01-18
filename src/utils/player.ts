import { useSubscription } from 'utils/hooks'
import createSub from 'utils/subscription'
import { main } from 'workers'
import type { Podcast } from 'main/store'

const audio = document.querySelector('#player') as HTMLAudioElement
audio.volume = 0.4

export const trackSub = createSub<string | null>()
export const useTrack = () => useSubscription(trackSub)[0]

type PlayState = 'playing' | 'paused'

export const playState = createSub<PlayState>()
export const usePlayState = () => useSubscription(playState)[0]

export function useTrackState(episode?: string): PlayState {
  const state = usePlayState()
  const track = useTrack()
  return track === episode ? state : 'paused'
}

const playing = createSub<[Podcast, EpisodeMin]>()
export const usePlaying = () => useSubscription(playing)[0]

async function setEpisode(epId: EpisodeId) {
  logger.info(epId)
  const [podcast, episode] = await Promise.all([
    main.podcast(epId[0]),
    main.episode(epId),
  ])
  if (!episode) throw Error("couldn't find episode " + epId.join(', '))
  playing.setState([podcast!, episode])
  trackSub.setState(episode.file)
  audio.src = episode.file
  main.setPlaying(epId)
}

export async function play(epId?: EpisodeId) {
  if (epId) await setEpisode(epId)
  if (!audio.src) return
  if (playState.state !== 'playing') playState.setState('playing')
  await audio.play()

  const mediaSession = navigator.mediaSession
  if (!epId || !mediaSession) return

  const [podcast, episode] = playing.state

  const meta = {
    title: episode.title,
    artist: podcast.author ?? undefined,
    album: podcast.title,
    artwork: [{ src: podcast.artwork as string }],
  }
  logger.info(meta)

  mediaSession.metadata = new MediaMetadata(meta)
  mediaSession.setActionHandler('seekbackward', () => {
    skip(-15)
  })
  mediaSession.setActionHandler('seekforward', () => {
    skip(30)
  })
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

function skip(dt: number) {
  const time = Math.min(Math.max(audio.currentTime + dt, 0), audio.duration)
  audio.currentTime = time
}

window.addEventListener('echo_skip', (e: Event) => {
  skip((e as EchoSkipEvent).detail.seconds)
})

audio.addEventListener('play', () => {
  playState.setState('playing')
})

audio.addEventListener('pause', () => {
  playState.setState('paused')
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

Promise.all([main.getPlaying(), main.getProgress()]).then(
  async ([episode, progress]) => {
    if (trackSub.state || !episode) return
    playState.setState('paused')
    await setEpisode(episode)
    if (progress) audio.currentTime = progress
  }
)
