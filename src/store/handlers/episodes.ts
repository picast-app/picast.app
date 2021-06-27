import type { Episode } from 'store/state'
import type { Store } from 'store'
import idb from 'main/store/idb'
import { mergeInPlace, seg } from 'utils/path'
import { diff } from 'utils/array'
import { allFlat } from 'utils/promise'
import * as o from 'utils/object'
import equals from 'utils/equal'

function writeEpisodeData(
  cache: Record<string, Episode>,
  data: unknown,
  ...path: string[]
): boolean {
  const before = { ...cache[path[0]] }

  mergeInPlace(cache, data, ...path)
  cache[path[0]] = o.filter(
    o.pick(
      cache[path[0]],
      'id',
      'podcast',
      'title',
      'file',
      'published',
      'duration',
      'currentTime',
      'relProg'
    ),
    (_, v) => typeof v !== 'object' || v === null
  ) as Episode

  return equals(before, cache[path[0]])
}

export default (store: Store) => {
  const cache: { [pod: string]: { [ep: string]: Episode } } = {}

  let subscriptions: Promise<string[]> = store.get('user.subscriptions')

  store
    .handler('episodes.*.*')
    .set(async (data, path, { known, noChange }, pod, id) => {
      if (!data) return
      if (writeEpisodeData((cache[pod] ??= {}), data, ...seg(path, 2)))
        return noChange?.()
      if (!known && (await subscriptions).includes(pod))
        await writeToDB(cache[pod][id])
    }, true)

  store
    .handler('episodes.*.*')
    .get(async (_, pod, id) => cache[pod]?.[id] ?? (await readIDB(pod, id)))

  async function readIDB(podcast: string, id: string) {
    const data = await (await idb).get('episodes', id)
    if (data) store.set('episodes.*.*', data, { known: true }, podcast, id)
    return data ?? null
  }

  async function writeToDB(episode: Episode) {
    await (await idb).put('episodes', episode)
  }

  async function removeFromDB(...podcasts: string[]) {
    const db = await idb
    const keys = await allFlat(
      podcasts.map(id => db.getAllKeysFromIndex('episodes', 'podcast', id))
    )
    if (!keys.length) return

    // write uncached episodes from db to cache
    const known = new Set(podcasts.flatMap(id => Object.keys(cache[id] ?? {})))
    const unknown = keys.filter(key => !known.has(key))
    await readToCache(unknown)

    logger.info(`remove ${keys.length} episodes from db`)
    const tx = db.transaction('episodes', 'readwrite')
    await Promise.all<any>([...keys.map(id => tx.store.delete(id)), tx.done])
  }

  async function storeInDB(...podcasts: string[]) {
    const episodes = podcasts.flatMap(id => Object.values(cache[id] ?? {}))
    if (!episodes.length) return
    logger.info(`store ${episodes.length} episodes in db`)
    const tx = (await idb).transaction('episodes', 'readwrite')
    await Promise.all<any>([episodes.map(v => tx.store.put(v)), tx.done])
  }

  async function readToCache(keys: string[]) {
    if (!keys.length) return
    const db = await idb
    await Promise.all(
      keys.map(async key => {
        const episode = await db.get('episodes', key)
        if (episode)
          store.set('episodes.*.*', episode, {}, episode.podcast, episode.id)
      })
    )
  }

  store.listen('user.subscriptions', async subs => {
    const [added, removed] = diff(await subscriptions, subs)
    subscriptions = Promise.resolve(subs)
    await storeInDB(...added)
    await removeFromDB(...removed)
  })
}
