import { GraphQLClient } from 'graphql-request'
import type { DocumentNode } from 'graphql'
import type GQL from 'types/gql'

export const client = new GraphQLClient(process.env.REACT_APP_API as string, {
  headers: {},
  credentials: 'include',
})

export const APICall = <T extends Calls>(query: DocumentNode) => <
  TP extends any[],
  TR
>(
  p2a: (...args: TP) => GQL[`${T}Variables`],
  format: (res: GQL[T]) => TR
) => (client: GraphQLClient) => async (...args: TP): Promise<TR> =>
  format(
    await client.request<GQL[T], GQL[`${T}Variables`]>(query, p2a(...args))
  )

type WhereVar<T> = {
  [K in keyof T]: K extends string
    ? `${K}Variables` extends keyof T
      ? K
      : never
    : never
}[keyof T]

type Calls = WhereVar<GQL>
