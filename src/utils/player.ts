// import { useState, useEffect } from 'react'
import { useState, useEffect, useReducer } from 'react'
import { useAppState, useSubscription } from 'utils/hooks'
import subscription from 'utils/subscription'
// import { main } from 'workers'
// import { proxy } from 'comlink'
import type { Podcast } from 'main/store/types'
import type Player from 'components/webcomponents/player/bar'
import { main } from 'workers'

// const audio = document.querySelector('#player') as HTMLAudioElement
// audio.volume = 0.4

// const trackSub = subscription<string | undefined>()
// export const useTrack = () => useSubscription(trackSub)[0]
// main.state(
//   'playing.episode',
//   proxy(v => {
//     const episode = v as EpisodeMin | undefined
//     trackSub.setState(episode?.file)
//     if (!episode?.file) return
//     audio.src = episode?.file
//     audio.currentTime = episode.currentTime ?? 0
//   })
// )

// type PlayState = 'playing' | 'paused'

// export const playState = subscription<PlayState>('paused')
// export const usePlayState = () => useSubscription(playState)[0]

export const usePlaying = (): [podcast?: Podcast, episode?: EpisodeMin] => {
  const [{ podcast, episode } = {} as any] = useAppState<any>('playing')
  return episode ? [podcast, episode] : []
}

export const playerSub = subscription<Player>()
export const usePlayer = () => useSubscription(playerSub)[0]

export const isPlayingSub = subscription(false)
playerSub.subscribe(player => {
  if (!player) return
  const onPlay = () => isPlayingSub.setState(true)
  const onPause = () => isPlayingSub.setState(false)
  player.addEventListener('play', onPlay)
  player.addEventListener('pause', onPause)
  return () => {
    player.removeEventListener('play', onPlay)
    player.removeEventListener('pause', onPause)
  }
})
export const useIsPlaying = () => useSubscription(isPlayingSub)[0]

export function useIsCurrent([pod, ep]: EpisodeId) {
  const player = usePlayer()

  const [isCurrent, setIsCurrent] = useState(
    player?.podcast?.id === pod && player?.episode?.id === ep
  )

  useEffect(() => {
    if (!player) return
    const onChange = ({ detail }: CustomEvent<[string, string]>) =>
      setIsCurrent(detail[0] === pod && detail[1] === ep)
    player.addEventListener('episodeChange', onChange as any)
    return () => player.removeEventListener('episodeChange', onChange as any)
  }, [player, pod, ep])

  return isCurrent
}

export function useEpisodePlaying(id: EpisodeId) {
  const playing = useIsPlaying()
  const isCurrent = useIsCurrent(id)
  const [epPlaying, setEpPlaying] = useState(isCurrent && playing)

  useEffect(() => {
    setEpPlaying(isCurrent && playing)
  }, [playing, isCurrent])

  return epPlaying
}

export function useEpisodeProgress(id: EpisodeId, initialProgress = 0) {
  type State = { progress: number; duration: number; playing: boolean }
  const [state, update] = useReducer(
    (state: State, update: Partial<State>): State => ({ ...state, ...update }),
    { progress: initialProgress, duration: 30, playing: false }
  )

  const isPlaying = useIsPlaying()
  const isActive = useIsCurrent(id)

  const epId = id[1]

  useEffect(() => {
    if (!isActive) return update({ playing: false })

    const audio = playerSub.state.audio

    const playUpdate = () => ({
      duration: audio.duration,
      progress: audio.currentTime / audio.duration,
    })

    const onChange = () => {
      update(playUpdate())
    }
    audio.addEventListener('seeked', onChange)

    if (!isPlaying) {
      main
        .getEpisodeProgress(epId)
        .then(progress => update({ playing: false, progress }))
      return () => {
        audio.removeEventListener('seeked', onChange)
      }
    }

    update({ playing: true, ...playUpdate() })

    audio.addEventListener('durationchange', onChange)
    return () => {
      audio.removeEventListener('durationchange', onChange)
      audio.removeEventListener('seeked', onChange)
    }
  }, [isActive, isPlaying, epId])

  return state
}

// export function useTrackState(episode?: string): PlayState {
//   const state = usePlayState()
//   const track = useTrack()
//   return track === episode ? state : 'paused'
// }

// const durSub = subscription<number>(() => {
//   const onChange = () => {
//     durSub.setState(audio.duration)
//   }
//   audio.addEventListener('durationchange', onChange)
//   return () => audio.removeEventListener('durationchange', onChange)
// })

// export function useEpisodeProgress(
//   episode: string,
//   initial = 0
// ): [progress: number, playing: boolean, duration: number] {
//   const state = useTrackState(episode)
//   const [progress, setProgress] = useState(initial)
//   const [duration] = useSubscription(durSub)

//   useEffect(() => {
//     if (state !== 'playing' || isNaN(duration)) return

//     const set = () => setProgress(audio.currentTime / duration)
//     set()

//     audio.addEventListener('seeked', set)
//     return () => {
//       audio.removeEventListener('seeked', set)
//       set()
//     }
//   }, [state, duration])

//   return [progress, state === 'playing', duration]
// }

// async function waitForTrack(src: string) {
//   if (audio.src === src) return
//   await new Promise<void>(res => {
//     const handler = () => {
//       if (audio.src !== src) return
//       audio.removeEventListener('canplay', handler)
//       res()
//     }
//     audio.addEventListener('canplay', handler)
//   })
// }

// export async function play(epId?: EpisodeId) {
//   if (playState.state !== 'playing') playState.setState('playing')
//   const track = epId && (await main.setPlaying(epId))
//   if (track) await waitForTrack(track)
//   await audio.play()
//   if (track) await setMediaInfo()
// }

// async function setMediaInfo() {
//   if (!navigator.mediaSession) return

//   const { podcast, episode } = ((await main.readState('playing')) as any) ?? {}

//   const meta = {
//     title: episode.title,
//     artist: podcast.author ?? undefined,
//     album: podcast.title,
//     artwork: [{ src: podcast.artwork as string }],
//   }
//   logger.info({ meta })

//   navigator.mediaSession.metadata = new MediaMetadata(meta)
//   navigator.mediaSession.setActionHandler('seekbackward', () => {
//     skip(-15)
//   })
//   navigator.mediaSession.setActionHandler('seekforward', () => {
//     skip(30)
//   })
// }

// export function pause() {
//   if (playState.state !== 'paused') playState.setState('paused')
//   audio.pause()
// }

// export async function togglePlay() {
//   if (playState.state === 'paused') await play()
//   else pause()
// }

// window.addEventListener('echo_play', async (e: Event) => {
//   const { episode } = (e as EchoPlayEvent).detail
//   await play(episode)
//   startProgressSync()
// })
// window.addEventListener('echo_pause', pause)
// window.addEventListener('echo_jump', (e: Event) => {
//   audio.currentTime = (e as EchoJumpEvent).detail.location
// })

// function skip(dt: number) {
//   const time = Math.min(Math.max(audio.currentTime + dt, 0), audio.duration)
//   audio.currentTime = time
// }

// window.addEventListener('echo_skip', (e: Event) => {
//   skip((e as EchoSkipEvent).detail.seconds)
// })

// audio.addEventListener('play', () => {
//   playState.setState('playing')
// })

// audio.addEventListener('pause', () => {
//   playState.setState('paused')
// })

// audio.addEventListener('ended', () => {
//   playState.setState('paused')
//   main.setPlaying(null)
// })

// const syncEvents = ['seeked', 'play', 'pause']
// syncEvents.forEach(event => {
//   audio.addEventListener(event, () => {
//     main.setProgress(audio.currentTime)
//   })
// })

// let psId: number
// function startProgressSync() {
//   clearTimeout(psId)
//   main.setProgress(audio.currentTime)
//   psId = setTimeout(startProgressSync, 5000)
// }

// const stopSyncEvents = ['pause', 'ended']
// stopSyncEvents.forEach(event => {
//   audio.addEventListener(event, () => {
//     clearTimeout(psId)
//   })
// })

// self.addEventListener(
//   'onpagehide' in self ? 'pagehide' : 'unload',
//   () => {
//     main.setProgress(audio.currentTime)
//   },
//   { capture: true }
// )
