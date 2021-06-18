import { wsApi } from './ws'
import stateProm from './appState'
import store from './store'

export async function setPlaying(
  id: EpisodeId | null,
  passive = false,
  position?: number | null
): Promise<string | undefined> {
  // const { state } = await stateProm
  // if (state.playing.id?.[1] === id?.[1]) return
  // await store.setPlaying(id)
  // if (id) syncTimes[id[1]] = Date.now()
  // if (position && id) await store.setEpisodeProgress(id[1], position)
  // const episode = await state.playing.set(id)
  // if (!passive && id && state.user.wsAuth)
  //   await wsApi.notify(
  //     'setCurrent',
  //     id[0],
  //     id[1],
  //     position ?? 0,
  //     state.user.wsAuth
  //   )
  // return episode?.file
  return undefined
}

const syncTimes: Record<string, number> = {}

export async function setProgress(progress: number, forceSync = false) {
  // const { state } = await stateProm
  // const id = state.playing.id?.[1]
  // if (!id) return
  // await store.setEpisodeProgress(id, progress)
  // if (!state.user.wsAuth) return
  // if (!(id in syncTimes)) syncTimes[id] = Date.now()
  // const dt = Date.now() - syncTimes[id]
  // if (dt < 58000 && !forceSync) return
  // syncTimes[id] += dt
  // await wsApi.notify(
  //   'setCurrent',
  //   state.playing.id![0],
  //   id,
  //   progress,
  //   state.user.wsAuth
  // )
}

export async function playbackCompleted() {
  // const { state } = await stateProm
  // const id = state.playing.id?.[1]
  // if (!id) throw Error('no episode playing')
  // await Promise.all([
  //   state.playing.set(null),
  //   store.setPlaying(null),
  //   store.setEpisodeCompleted(id),
  // ])
}
