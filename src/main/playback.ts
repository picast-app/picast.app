import { wsApi } from './ws'
import stateProm from './appState'
import store from './store'

export async function setPlaying(
  id: EpisodeId | null,
  passive = false
): Promise<string | undefined> {
  const { state } = await stateProm
  if (state.playing.id?.[1] === id?.[1]) return
  await store.setPlaying(id)
  const episode = await state.playing.set(id)
  if (!passive && id && state.user.wsAuth)
    await wsApi.notify('setCurrent', id[0], id[1], 0, state.user.wsAuth)
  return episode?.file
}

export async function setProgress(progress: number) {
  const { state } = await stateProm
  if (!state.playing.episode) return
  await store.setEpisodeProgress(state.playing.episode.id, progress)
}
