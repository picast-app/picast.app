import { wsApi } from './ws'
import stateProm from './appState'
import store from './store'

export async function setPlaying(id: EpisodeId | null) {
  const { state } = await stateProm
  if (state.playing.id?.[1] === id?.[1]) return
  await store.setPlaying(id)
  state.playing.set(id)
  if (!id || !state.user?.wsAuth) return
  await wsApi.notify('setCurrent', id[0], id[1], 0, state.user.wsAuth)
}

export async function setProgress(progress: number) {
  const { state } = await stateProm
  if (!state.playing.episode) return
  await store.setEpisodeProgress(state.playing.episode.id, progress)
}
