import idb from 'main/idb/idb'
import { unwrap } from 'idb'
import type { DBSchema } from 'idb'
import type Schema from 'main/idb/schema'

class Store<T extends DBSchema[string]> {
  constructor(
    private readonly db: Promise<IDBDatabase>,
    private readonly storeName: string,
    private readonly batchWindow: number
  ) {}

  public put(value: T['value']) {
    this.queue.push(value)
    if (this.queueing) return
    this.queueing = true
    setTimeout(() => this.commit(), this.batchWindow)
  }

  private queue: T['value'][] = []
  private queueing = false
  private inProg = new Set<symbol>()

  private async commit() {
    const idb = await this.db
    const msg = `[${this.storeName}]: commit ${this.queue.length} records`
    if (this.inProg.size) logger.warn('stalled ' + msg)
    else logger.info(msg)
    // @ts-ignore
    const transaction = idb.transaction('episodes', 'readwrite', {
      durability: 'relaxed',
    })
    const store = transaction.objectStore(this.storeName)
    for (const record of this.queue) store.add(record)
    this.queueing = false
    this.queue = []
    const t0 = performance.now()

    const id = Symbol()
    this.inProg.add(id)
    transaction.oncomplete = () => {
      this.inProg.delete(id)
      const dt = performance.now() - t0
      if (dt >= this.batchWindow) logger.info(`commit took ${dt} ms`)
    }
  }
}

const db: any = idb.then(v => unwrap(v as any))

export const episodes = new Store<Schema['episodes']>(db, 'episodes', 1000)
