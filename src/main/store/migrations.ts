import type { IDBPDatabase } from 'idb'
import type Schema from './schema'

type Migration = (db: IDBPDatabase<Schema>) => Promise<void> | void

const migrations: Record<number, Migration> = {
  3: db => {
    db.createObjectStore('meta').put('UP_TO_DATE', 'updateStatus')
    db.createObjectStore('subscriptions', { keyPath: 'id' })
    const epStore = db.createObjectStore('episodes', { keyPath: 'id' })
    epStore.createIndex('date', 'date')
    epStore.createIndex('podcast', 'podcast')
  },
}

export default migrations
