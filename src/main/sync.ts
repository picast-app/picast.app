import * as api from 'api/calls'
import { store, user } from 'store'
import { collection } from 'utils/array'
import { mapList, mapValuesAsync } from 'utils/object'
import epStore from 'main/episodeStore'
import { hashIds, encodeIds } from 'utils/encode'
import * as convert from 'api/convert'

const hour = (n: number) => n * 60 ** 2 * 1000

const META_RATE = hour(24)
const EPISODE_RATE = hour(1)

const expired = (rate: number, last?: number) =>
  Date.now() - (last ?? 0) >= rate

const episodeCRC = async (podcast: string) =>
  hashIds((await (await epStore).getPodcast(podcast)).episodeIds)

function saveCheckDate(checks: CheckParam[]) {
  for (const { id, meta, episodes } of checks) {
    if (meta) store.set('podcasts.*.lastMetaCheck', Date.now(), {}, id)
    if (episodes) store.set('podcasts.*.lastEpisodeCheck', Date.now(), {}, id)
  }
}

export async function pullPodcasts(
  opts: { meta?: boolean; episodes?: boolean; force?: boolean } = {
    meta: true,
    episodes: true,
    force: false,
  }
) {
  const podcasts = collection(await store.get('library.list'), ({ id }) => id)
  const isExpired = opts.force ? () => true : expired

  let checks = await Promise.all(
    mapList(podcasts, async ({ id }) => {
      const check: CheckParam = { id }

      if (opts.meta && isExpired(META_RATE, podcasts[id].lastMetaCheck))
        check.meta = podcasts[id].check

      if (
        opts.episodes &&
        isExpired(EPISODE_RATE, podcasts[id].lastEpisodeCheck)
      )
        check.episodes = await episodeCRC(id)

      logger.info({ check, podcast: podcasts[id] })

      return check
    })
  )
  checks = checks.filter(({ meta, episodes }) => meta || episodes)

  if (!checks?.length) return logger.info('skip refresh, nothing to check')
  logger.info('pull podcasts:', ...checks)

  saveCheckDate(checks)
  const updates = await api.query.metaSync(checks)
  logger.info({ updates })

  const eps: string[] = []

  updates.forEach(({ id, podcast, episodesMatch }) => {
    if (podcast) {
      logger.info(`update ${id} meta:`, podcast)
      store.merge('podcasts.*', convert.podcast(podcast), id)
    }
    if (episodesMatch === false) {
      logger.info(`fetch new episodes for ${id}`)
      eps.push(id)
    }
  })

  await pullDiffEpisodes(eps)
}

type CheckParam = { id: string; meta?: string; episodes?: string }

async function pullDiffEpisodes(podIds: string[]) {
  if (!podIds.length) return

  const stores = Object.fromEntries(
    await Promise.all(
      podIds.map(id =>
        epStore.then(eps => eps.getPodcast(id).then(v => [id, v] as const))
      )
    )
  )

  const results = await api.query.diffEpisodes(
    ...podIds.map(id => [id, encodeIds(stores[id].episodeIds)] as const)
  )

  for (const { podcast, added, removed } of results) {
    if (removed?.length) logger.info(`removed from ${podcast}`, ...removed)
    if (added?.length) {
      logger.info(`added to ${podcast}`, ...added)
      stores[podcast].addEpisodes(
        added.map(v => convert.episode(v, podcast)),
        true
      )
    }
  }
}

export async function pullSubscriptions(): Promise<
  { added: string[]; removed: string[] } | undefined
> {
  const subs = await store.get('user.subscriptions')
  if (!subs?.length) return

  const me = await api.query.me(subs)
  const diff = await user.storePodcastsDiff(me?.subscriptions)

  if (diff)
    return await mapValuesAsync(diff, ids =>
      Promise.all(ids.map(id => store.get('podcasts.*.title', id)))
    )
}
