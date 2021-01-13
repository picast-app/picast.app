import { openDB } from 'idb/with-async-ittr'
import type Schema from './schema'
import logger from 'utils/logger'
import migrations from './migrations'

const VERSION = 3

export default openDB<Schema>(self.location.hostname, VERSION, {
  async upgrade(db, oldVersion, newVersion) {
    if (!(newVersion! in migrations))
      logger.error(`version ${newVersion} not in migrations`)

    const toApply = Object.keys(migrations)
      .map(parseFloat)
      .sort()
      .filter(n => n > oldVersion && n <= newVersion!)

    for (const version of toApply) {
      logger.info(`upgrade to version ${version}`)
      await migrations[version](db)
    }
  },
})
