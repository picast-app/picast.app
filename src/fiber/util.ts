import { FiberRequest, FiberResponse } from './wellKnown'

export const genId = () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)

export const isFiberMsg = (msg: unknown): msg is FiberRequest | FiberResponse =>
  !!msg && typeof msg === 'object' && '__fid' in msg!

export const isError = (
  v: unknown,
  b?: boolean
): v is Pick<Error, 'message' | 'name' | 'stack'> => !!b

export const select = (node: any, path: (string | number)[]): any =>
  !path.length ? node : select(node[path[0]], path.slice(1))