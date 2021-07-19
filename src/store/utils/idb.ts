import dbProm from 'main/idb/idb'
import equal from 'utils/equal'
import { forEach } from 'utils/object'

export const idbWriter =
  <T extends keyof IDBMeta = keyof IDBMeta>(key: T) =>
  async (value: any) =>
    (await dbProm).put('meta', value, key)

type IDBMeta = {
  printLogs: boolean
  showTouchPaths: boolean
  extractColor: boolean
  currentUser: string
  subscriptions: string[]
  wpSubs: string[]
  libSort: string
  playerCurrent: EpisodeId
  playerQueue: string[]
  muted: boolean
  volume: number
}

export const idbDefaultReader = async <T extends keyof IDBMeta>(
  keys: readonly T[],
  defaults: { [K in T]?: IDBMeta[K] } = {}
): Promise<Pick<IDBMeta, T>> => {
  const idb = await dbProm
  const tx = idb.transaction('meta', 'readonly')
  const res = await Promise.all<any>([
    ...keys.map(key => tx.store.get(key).then(v => [key, v])),
    tx.done,
  ])

  const dbState: Partial<IDBMeta> = Object.fromEntries(res.slice(0, -1))
  const state = { ...dbState }
  forEach(defaults, (k, v) => {
    state[k] ??= v
  })

  if (!equal(state, dbState)) {
    const tx = idb.transaction('meta', 'readwrite')
    forEach(state, (k, v) => {
      if (v === dbState[k]) return
      logger.info('default meta', k, v)
      tx.store.put(v, k)
    })
    await tx.done
  }

  return state as any
}
