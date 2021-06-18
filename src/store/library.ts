import type { Store } from '.'
import type { Podcast } from 'store/state'
import { waiter } from 'utils/promise'
// import dbProm from 'main/store/idb'

export default async (store: Store) => {
  store.handler('library')

  // const [sort, init] = waiter<
  //   Record<string, Promise<Podcast | null> | Podcast | null>
  // >()

  let podcasts: Podcast[] = []

  let sorting = 'title'

  // store.handler('library.sorting').get(() => sort)
  store.handler('library.sorting').set(v => {
    if (sorting === v) return false
    sorting = v
  })

  // store.handler('library.list').get(() => [])

  store.handler('library').get(() => ({ sorting, list: podcasts }))

  // await dbProm

  store.listen('user.subscriptions', async ids => {
    logger.info({ ids })
    const pods = await Promise.all(ids.map(id => store.get('podcasts.*', id)))
    logger.info({ pods })
  })
}
