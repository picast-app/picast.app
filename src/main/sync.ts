import store from './store'
import * as api from './api'
import { wsApi } from './ws'
import stateProm from './appState'
import type { Podcast } from './store/types'

const hour = (n: number) => n * 60 ** 2 * 1000

const META_RATE = hour(24)
const EPISODE_RATE = hour(1)

export async function meta() {
  const podcasts = (await Promise.all(
    (await store.getSubscriptions()).map(id => store.podcast(id))
  )) as Podcast[]

  const sums = podcasts
    .map(({ id, lastMetaCheck, check: meta, lastEpisodeCheck }) => ({
      id,
      ...(Date.now() - (lastMetaCheck ?? 0) >= META_RATE && { meta }),
      ...(Date.now() - (lastEpisodeCheck ?? 0) >= EPISODE_RATE && {
        episodes: '',
      }),
    }))
    .filter(v => Object.keys(v).length > 1)

  await Promise.all(
    sums.map(
      sum =>
        sum.episodes !== undefined &&
        store.episodesCrc(sum.id).then(crc => {
          sum.episodes = crc
        })
    ) as any
  )

  if (!sums.length) return logger.info('skip meta check')

  logger.info(
    'meta check',
    sums.filter(v => v.meta).length,
    'sum check',
    sums.filter(v => v.episodes).length
  )
  const ids = sums.map(({ id }) => id)
  await store.metaChecked(...ids)
  await store.episodeChecked(...ids)

  const updates = await api.metaSync(sums)

  const metaChanges = updates.map(({ podcast }) => podcast!).filter(Boolean)
  await Promise.all(metaChanges.map(podcast => store.writePodcastMeta(podcast)))

  const episodeChanges = updates
    .filter((v: any) => !v.episodesMatch)
    .map(({ id }) => id)
  await store.fetchEpisodes(...episodeChanges)
}

export async function setPlaying(id: EpisodeId | null) {
  await store.setPlaying(id)
  const { state } = await stateProm
  if (!id || !state.user?.wsAuth) return
  await wsApi.notify('setCurrent', id[0], id[1], 0, state.user.wsAuth)
}
