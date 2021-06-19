import type { Store } from '.'
import type { Podcast } from 'store/state'
import { memoize } from 'utils/cache'

export default (store: Store) => {
  store.handler('library')

  let podcasts: Podcast[] = []

  let sorting = 'title'

  store.handler('library.sorting').set(v => {
    if (sorting === v) return false
    sorting = v
  })

  store
    .handler('library')
    .get(() => ({ sorting, list: sort(sorting, podcasts) }))

  store.listen('user.subscriptions', async ids => {
    await store.handlersDone()
    const pods = await Promise.all(ids.map(id => store.get('podcasts.*', id)))
    store.set('library.list', (podcasts = sort(sorting, pods as Podcast[])))
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
