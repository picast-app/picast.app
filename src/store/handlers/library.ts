import type { Store } from 'store'
import type { Podcast } from 'store/state'
import memoize from 'snatchblock/memoize'

export default (store: Store) => {
  store.handler('library')

  let podcasts: Podcast[] = []
  let sorting = 'title'
  let totalEpisodeCount: number

  store.handler('library.sorting').set(v => {
    if (sorting === v) return false
    sorting = v
  })

  store
    .handler('library')
    .get(() => ({ sorting, list: sort(sorting, podcasts), totalEpisodeCount }))

  store.handler('library.totalEpisodeCount').get(() => totalEpisodeCount)
  store.handler('library.totalEpisodeCount').set(v => {
    totalEpisodeCount = v
  })

  store.listen('user.subscriptions', async ids => {
    const pods = await Promise.all(ids.map(id => store.get('podcasts.*', id)))
    store.set('library.list', (podcasts = sort(sorting, pods as Podcast[])))

    const total = pods.reduce(
      (a, c) =>
        a + (c?.episodeCount ?? (logger.warn('no episode count for', c), 1000)),
      0
    )
    store.set('library.totalEpisodeCount', total)
  })
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
