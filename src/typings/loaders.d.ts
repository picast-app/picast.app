declare module '*.gql' {
  import { DocumentNode } from 'graphql'
  const value: DocumentNode
  export default value
}

declare module '*.html' {
  // import { DocumentNode } from 'graphql'
  // const value: DocumentNode
  // export default value
  const html: string
  export default html
}
