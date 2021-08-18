import type { Store } from 'store'
import * as api from 'api/calls'
import idb from 'main/idb/idb'
import { asyncNullishChain } from 'snatchblock/nullishChain'

export default (store: Store) => {
  store.handler('episodes.*.shownotes').get(async (_, epId) => {
    const podId = await store.get('ep2Pod.*', epId)
    if (!podId) return "couldn't fetch show notes"
    return await asyncNullishChain(readShowNotes, queryShownotes)([podId, epId])
  })

  store.handler('episodes.*.shownotes').set(async (shownotes, p, m, id) => {
    const db = await idb
    shownotes ??= (await db.get('episodeInfo', id))?.shownotes
    await db.put('episodeInfo', { id, shownotes, fetched: Date.now() })
  })

  async function readShowNotes([p, id]: EpisodeId) {
    const episode = await (await idb).get('episodeInfo', id)
    if (!episode?.shownotes) return
    if (Date.now() - episode.fetched > 2 * 60 * 60) queryShownotes([p, id])
    return episode.shownotes
  }

  async function queryShownotes(id: EpisodeId) {
    const episode = await api.query.episode(id)
    const notes = episode?.shownotes ?? undefined
    if (notes) store.set('episodes.*.shownotes', notes, {}, id[1])
    return notes
  }
}
