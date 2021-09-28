import type { Store } from 'store'
import type { Podcast } from 'store/state'
import memoize from 'snatchblock/memoize'
import { diff, notNullish } from 'utils/array'
import * as map from 'utils/map'
import { waiter } from 'utils/promise'

export default (store: Store) => {
  store.handler('library')

  let sorting = 'title'
  let totalEpisodeCount: number

  store.handler('library.sorting').set(v => {
    if (sorting === v) return false
    sorting = v
  })

  store
    .handler('library')
    .get(async () => ({ sorting, list: await getSubbed(), totalEpisodeCount }))

  store.handler('library.totalEpisodeCount').get(() => totalEpisodeCount)
  store.handler('library.totalEpisodeCount').set(v => {
    totalEpisodeCount = v
  })
  store.handler('library.list').set(pods => {
    const total = pods.reduce((a, c) => a + (c?.episodeCount ?? 1000), 0)
    store.set('library.totalEpisodeCount', total)
  })

  const listening = new Map<string, () => void>()
  store.listen('user.subscriptions', async ids => {
    const [added, removed] = diff([...listening.keys()], ids)
    removed.forEach(id => map.remove(listening, id)?.())

    await Promise.all(
      added.map(id => {
        const [prom, called] = waiter<void>()
        listening.set(
          id,
          store.listen(
            'podcasts.*',
            async () => {
              called()
              store.set('library.list', await getSubbed())
            },
            id
          )
        )
        return prom
      })
    )
    store.set('library.list', await getSubbed())
  })

  const getSubbed = async () => {
    const ids = await store.get('user.subscriptions')
    return sort(
      sorting,
      notNullish(await Promise.all(ids.map(id => store.get('podcasts.*', id))))
    )
  }
}

const sortFmt = memoize((title: string) =>
  title.trim().replace(/^(a|an|the)\s+(.*)/i, '$2, $1')
)

const sortings: Record<string, (a: Podcast, b: Podcast) => number> = {
  title: ({ title: a }, { title: b }) => sortFmt(a).localeCompare(sortFmt(b)),
}

function sort(sorting: string, podcasts: Podcast[]): Podcast[] {
  return [...podcasts].sort(sortings[sorting])
}
