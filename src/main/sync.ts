import store from './store'
import * as api from './api'
import type { Podcast } from './store/types'

const RATE = 24 * 60 ** 2 * 1000

export async function meta() {
  const podcasts = (await Promise.all(
    (await store.getSubscriptions()).map(id => store.podcast(id))
  )) as Podcast[]

  const sums = podcasts
    .filter(
      ({ lastMetaCheck, covers }) =>
        Date.now() - (lastMetaCheck ?? 0) >= RATE || !covers
    )
    .map(({ id, check = '' }) => ({ id, check }))
  if (!sums.length) return logger.info('skip meta check')

  logger.info('meta check', sums.length)
  await store.metaChecked(...sums.map(({ id }) => id))

  const updates = await api.metaSync(sums)
  if (!updates.length) return

  logger.info('update', ...updates.map(({ title }) => title))
  await Promise.all(updates.map(meta => store.writePodcastMeta(meta)))
}
