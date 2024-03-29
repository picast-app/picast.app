import { openDB } from 'idb/with-async-ittr'
import type IDBSchema from './schema'
import migrations from './migrations'
import { retry } from 'utils/promise'

const VERSION = 5

export default (globalThis as any).idb = retry(50, 100, () =>
  openDB<IDBSchema>(self.location.hostname, VERSION, {
    async upgrade(db, oldVersion, newVersion, transaction) {
      if (!(newVersion! in migrations))
        logger.error(`version ${newVersion} not in migrations`)

      const toApply = Object.keys(migrations)
        .map(parseFloat)
        .sort()
        .filter(n => n > oldVersion && n <= newVersion!)

      for (const version of toApply) {
        logger.info(`upgrade to version ${version}`)
        await migrations[version](db, transaction)
      }
    },
    blocked() {
      logger.warn('IDB upgrade blocked', VERSION)
    },
    blocking() {
      logger.warn('blocking IDB upgrade', VERSION)
    },
  })
)
