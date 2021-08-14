import type { IDBPDatabase, IDBPTransaction } from 'idb'
import type Schema from './schema'

type Migration = (
  db: IDBPDatabase<Schema>,
  tx: IDBPTransaction<Schema, (keyof Schema)[]>
) => Promise<void> | void

const migrations: Record<number, Migration> = {
  3: async db => {
    await db.createObjectStore('meta').put('UP_TO_DATE', 'updateStatus')
    db.createObjectStore('subscriptions', { keyPath: 'id' })
    const epStore = db.createObjectStore('episodes', { keyPath: 'id' })
    epStore.createIndex('published', 'published')
    epStore.createIndex('podcast', 'podcast')
  },
  4: async (db, tx) => {
    db.createObjectStore('podcasts')
    const podcasts = await tx.objectStore('subscriptions').getAll()
    for (const podcast of podcasts) {
      if (podcast.subscriptionDate)
        podcast.subscriptionDate = new Date(podcast.subscriptionDate).getTime()
      await tx.objectStore('podcasts').put(podcast)
    }
    await tx.objectStore('meta').put(
      podcasts.map(({ id }) => id),
      'subscriptions'
    )
  },
  5: db => {
    db.createObjectStore('episodeInfo', { keyPath: 'id' })
  },
}

export default migrations
