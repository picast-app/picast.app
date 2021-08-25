import dbProm from './idb'
import type Schema from './schema'
import type { IDBPDatabase } from 'idb'

type DB = IDBPDatabase<Schema>

// interface for accessing IDB from other threads
export default class IDBInterface {
  constructor(private readonly db: PromType<DB>) {}

  public static async create(): Promise<IDBInterface> {
    const db = await dbProm
    return new IDBInterface(db)
  }

  public async idbGet<T extends Parameters<DB['get']>[0]>(
    table: T,
    key: Schema[T]['key']
  ): Promise<Schema[T]['value'] | undefined> {
    return await this.db.get(table, key)
  }

  public async idbPut<T extends Parameters<DB['get']>[0]>(
    table: T,
    value: Schema[T]['value'],
    key?: Schema[T]['key']
  ) {
    await this.db.put(table, value, key)
  }

  public async getAll<T extends Parameters<DB['getAll']>[0]>(table: T) {
    return await this.db.getAll(table)
  }

  public async getAllKeysFromIndex<
    T extends keyof Schema,
    I extends Schema[T] extends { indexes: infer TI } ? keyof TI : never
  >(table: T, index: I, query: any) {
    return await this.db.getAllKeysFromIndex(table, index, query)
  }
}
