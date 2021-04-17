import { useState, useEffect, useReducer } from 'react'
import { useAppState, useSubscription } from 'utils/hooks'
import subscription from 'utils/subscription'
import type { Podcast } from 'main/store/types'
import type { Player } from 'components/webcomponents'
import { main } from 'workers'

export const usePlaying = (): [podcast?: Podcast, episode?: EpisodeMin] => {
  const [{ podcast, episode } = {} as any] = useAppState<any>('playing')
  return episode ? [podcast, episode] : []
}

export const playerSub = subscription<Player | undefined>()
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
    if (!playerSub.state) return
    if (!isActive) return update({ playing: false })

    const audio = playerSub.state.audio
    if (!audio) return

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
