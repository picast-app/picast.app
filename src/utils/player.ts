import { useState, useEffect } from 'react'
import { useSubscription, useAppState } from 'utils/hooks'
import subscription from 'utils/subscription'
import { main } from 'workers'
import { proxy } from 'comlink'
import type { Podcast } from 'main/store/types'

const audio = document.querySelector('#player') as HTMLAudioElement
audio.volume = 0.4

const trackSub = subscription<string | undefined>()
export const useTrack = () => useSubscription(trackSub)[0]
main.state(
  'playing.episode',
  proxy(v => {
    const episode = v as EpisodeMin | undefined
    trackSub.setState(episode?.file)
    if (!episode?.file) return
    audio.src = episode?.file
    audio.currentTime = episode.currentTime ?? 0
  })
)

type PlayState = 'playing' | 'paused'

export const playState = subscription<PlayState>('paused')
export const usePlayState = () => useSubscription(playState)[0]

export const usePlaying = (): [podcast?: Podcast, episode?: EpisodeMin] => {
  const [{ podcast, episode } = {} as any] = useAppState<any>('playing')
  return episode ? [podcast, episode] : []
}

export function useTrackState(episode?: string): PlayState {
  const state = usePlayState()
  const track = useTrack()
  return track === episode ? state : 'paused'
}

const durSub = subscription<number>(() => {
  const onChange = () => {
    durSub.setState(audio.duration)
  }
  audio.addEventListener('durationchange', onChange)
  return () => audio.removeEventListener('durationchange', onChange)
})

export function useEpisodeProgress(
  episode: string
): [progress: number, playing: boolean, duration: number] {
  const state = useTrackState(episode)
  const [progress, setProgress] = useState(0)
  const [duration] = useSubscription(durSub)

  useEffect(() => {
    if (state !== 'playing' || isNaN(duration)) return

    const set = () => setProgress(audio.currentTime / duration)
    set()

    audio.addEventListener('seeked', set)
    return () => {
      audio.removeEventListener('seeked', set)
      set()
    }
  }, [state, duration])

  return [progress, state === 'playing', duration]
}

export async function play(epId?: EpisodeId) {
  if (epId) await main.setPlaying(epId)
  if (!audio.src) return
  if (playState.state !== 'playing') playState.setState('playing')
  await audio.play()

  const mediaSession = navigator.mediaSession
  if (!epId || !mediaSession) return

  const { podcast, episode } = ((await main.readState('playing')) as any) ?? {}

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
