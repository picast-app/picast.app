import { client } from '../client'
import { mapValues } from 'utils/object'
import * as q from './queries'
import * as m from './mutations'

export const query: {
  [K in keyof typeof q]: ReturnType<typeof q[K]>
} = mapValues(q, v => v(client)) as any

export const mutate: {
  [K in keyof typeof m]: ReturnType<typeof m[K]>
} = mapValues(m, v => v(client)) as any
