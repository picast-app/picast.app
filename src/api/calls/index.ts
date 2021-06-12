import { client } from '../client'
import * as q from './queries'
import { mapValues } from 'utils/object'

export const query: {
  [K in keyof typeof q]: ReturnType<typeof q[K]>
} = mapValues(q, v => v(client)) as any
