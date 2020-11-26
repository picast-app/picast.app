type MainAPI = {
  podcast(
    id: string
  ): Promise<GqlType<import('gql/types').PodcastPage['podcast']>>
  feed(url: string): Promise<import('gql/types').FetchFeed['feed']>
  search(query: string): Promise<import('gql/types').SearchPodcast['search']>
  subscribe(id: string): void
}

type WorkerName = 'service' | 'main'

type WorkerMsg<T extends WorkerMsgType = unknown> = {
  id?: string
  responseTo?: string
  type: WorkerMsgType
  payload: WorkerMsgPayload<T>
}

type WorkerMsgType = 'ADD_MSG_CHANNEL' | 'DB_READ' | 'DB_WRITE' | 'DB_DATA'

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
  : never
