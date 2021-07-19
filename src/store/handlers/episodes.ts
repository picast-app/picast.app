import type { Episode } from 'store/state'
import type { Store } from 'store'
import idb from 'main/idb/idb'
import { seg, mutate } from 'utils/path'
import { diff } from 'utils/array'
import { allFlat } from 'utils/promise'
import * as o from 'utils/object'
import equals from 'utils/equal'

function writeEpisodeData(
  cache: Map<string, Episode>,
  data: any,
  ...[id, ...path]: string[]
): boolean {
  const previous = cache.get(id)
  let state: any = previous ?? {}

  const filter = (state: any) =>
    o.filter(
      o.pick(
        state,
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

  if (!path.length) {
    data = filter(data)
    if (equals(previous, data)) return true
    cache.set(id, data)
    return false
  }

  const old = mutate(state, data, ...path)
  state = filter(state)

  if (!previous) {
    cache.set(id, state)
    return false
  }

  return equals(old, data)
}

export default (store: Store) => {
  const cache = new Map<string, Episode>()

  let subscriptions: Promise<string[]> = store.get('user.subscriptions')

  store
    .handler('episodes.*')
    .set(async (data, path, { known, noChange }, id) => {
      if (!data) return
      if (writeEpisodeData(cache, data, ...seg(path, 1)))
        if (!known && (await subscriptions).includes(cache.get(id)!.podcast))
          await writeToDB(cache.get(id)!)
    }, true)

  store
    .handler('episodes.*')
    .get(async (_, id) => cache.get(id) ?? (await readIDB(id)))

  async function readIDB(id: string) {
    const data = await (await idb).get('episodes', id)
    if (data) store.set('episodes.*', data, { known: true }, id)
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
    const unknown = keys.filter(key => !(key in cache))
    await readToCache(unknown)

    logger.info(`remove ${keys.length} episodes from db`)
    const tx = db.transaction('episodes', 'readwrite')
    await Promise.all<any>([...keys.map(id => tx.store.delete(id)), tx.done])
  }

  async function storeInDB(...podcasts: string[]) {
    const podIds = new Set(podcasts)
    const episodes: Episode[] = []
    for (const [, episode] of cache)
      if (podIds.has(episode.podcast)) episodes.push(episode)
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
        if (episode) store.set('episodes.*', episode, {}, episode.id)
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
