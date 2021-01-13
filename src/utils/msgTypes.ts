import DBSchema from 'main/store/schema'

export type WorkerName = 'service' | 'main' | 'ui'

export type WorkerMsg<T extends WorkerMsgType> = {
  id?: string
  responseTo?: string
  type: T
  payload: WorkerMsgPayload<T>
}

export type WorkerMsgType =
  | 'ADD_MSG_CHANNEL'
  | 'DB_READ'
  | 'DB_WRITE'
  | 'DB_DATA'
  | 'ADD_FEED_SUB'
  | 'CONFIRM_FEED_SUB'
  | 'CANCEL_FEED_SUB'
  | 'FEED_ADDED'

export type WorkerMsgPayload<
  T extends WorkerMsgType
> = T extends 'ADD_MSG_CHANNEL'
  ? { target: WorkerName; port: MessagePort }
  : T extends 'DB_READ'
  ? DBRead<any>
  : T extends 'DB_WRITE'
  ? DBWrite<any>
  : T extends 'DB_DATA'
  ? any
  : T extends 'ADD_FEED_SUB'
  ? { podcast: string; limit?: number }
  : T extends 'CONFIRM_FEED_SUB'
  ? { subId: string }
  : T extends 'CANCEL_FEED_SUB'
  ? { subId: string }
  : T extends 'FEED_ADDED'
  ? { episodes: EpisodeMin[]; subId: string }
  : never

type DBRead<T extends keyof DBSchema> = { table: T; key: DBSchema[T]['key'] }
type DBWrite<T extends keyof DBSchema> = DBRead<T> & {
  data: DBSchema[T]['value']
}
