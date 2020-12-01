type MainAPI = {
  podcast(id: string): Promise<Podcast>
  episode(id: EpisodeId): Promise<EpisodeMin | undefined>
  feed(url: string): Promise<import('gql/types').FetchFeed['feed']>
  search(query: string): Promise<import('gql/types').SearchPodcast['search']>
  subscribe(id: string): void
  unsubscribe(id: string): void
  subscriptions(cb: SubscriptionListener): Promise<string[]>
}

type SubscriptionListener = (v: {
  added?: string[]
  removed?: string[]
}) => void

type WorkerName = 'service' | 'main' | 'ui'

type WorkerMsg<T extends WorkerMsgType = unknown> = {
  id?: string
  responseTo?: string
  type: WorkerMsgType
  payload: WorkerMsgPayload<T>
}

type WorkerMsgType =
  | 'ADD_MSG_CHANNEL'
  | 'DB_READ'
  | 'DB_WRITE'
  | 'DB_DATA'
  | 'ADD_FEED_SUB'
  | 'CONFIRM_FEED_SUB'
  | 'CANCEL_FEED_SUB'
  | 'FEED_ADDED'

type WorkerMsgPayload<T extends WorkerMsgType> = T extends 'ADD_MSG_CHANNEL'
  ? { target: WorkerName; port: MessagePort }
  : T extends 'DB_READ'
  ? { table: keyof EchoDB; key: EchoDB[table]['key'] }
  : T extends 'DB_WRITE'
  ? {
      table: keyof EchoDB
      key: EchoDB[table]['key']
      data: EchoDB[table]['value']
    }
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
