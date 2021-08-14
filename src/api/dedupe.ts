import type { GraphQLClient } from 'graphql-request'
import type { DocumentNode, OperationDefinitionNode } from 'graphql'

export default (client: GraphQLClient) => {
  const request = client.request
  const inProgress: Record<string, Promise<any>> = {}

  return (async (
    ...[doc, params, headers]: Parameters<GraphQLClient['request']>
  ) => {
    const call = () => request.call(client, doc, params, headers)
    if (typeof doc === 'string') return await call()
    const query = isSingleQuery(doc)
    if (!query) return await call()
    const id = `${query}#${paramStr(params)}`
    return await (inProgress[id] ??= call().finally(() => {
      delete inProgress[id]
    }))
  }) as GraphQLClient['request']
}

function isSingleQuery({ definitions }: DocumentNode): string | false {
  if (
    definitions.some(
      v =>
        v.kind !== 'FragmentDefinition' &&
        (v.kind !== 'OperationDefinition' || v.operation !== 'query')
    )
  )
    return false

  const queries = definitions.filter(
    v => v.kind === 'OperationDefinition'
  ) as OperationDefinitionNode[]

  if (queries.length !== 1) return false
  return queries[0].name?.value ?? false
}

function paramStr(params: unknown): string {
  if (typeof params !== 'object' || params === null)
    return JSON.stringify(params)
  return Object.entries(params)
    .sort(([a], [b]) => (b as any) - (a as any))
    .map(([k, v]) => `${k}-${v}`)
    .join('|')
}
