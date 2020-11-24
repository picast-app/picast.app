import query from 'gql/queries/podcast.gql'
import { expose } from 'comlink'
import { GraphQLClient } from 'graphql-request'
import type * as T from 'gql/types'

declare let self: DedicatedWorkerGlobalScope
export default null

self.onmessage = e => {
  console.log('[worker]: got message', e)
}

const client = new GraphQLClient(process.env.REACT_APP_API as string, {
  headers: {},
})

const api: MainAPI = {
  async podcast(id: string): Promise<T.PodcastTmp['podcast']> {
    const { podcast } = await client.request<
      T.PodcastTmp,
      T.PodcastTmpVariables
    >(query, {
      id: '6v03',
    })
    return podcast
  },
}

expose(api)
