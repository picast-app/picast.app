import query from 'gql/queries/podcast.gql'
import { expose } from 'comlink'
import { GraphQLClient } from 'graphql-request'
import type * as T from 'gql/types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare let self: DedicatedWorkerGlobalScope
export default null

const client = new GraphQLClient(process.env.REACT_APP_API as string, {
  headers: {},
})

const api: MainAPI = {
  async podcast(id: string): Promise<T.PodcastPage['podcast']> {
    const { podcast } = await client.request<
      T.PodcastPage,
      T.PodcastPageVariables
    >(query, { id })
    return podcast
  },
}

expose(api)
