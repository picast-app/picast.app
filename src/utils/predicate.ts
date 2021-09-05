export const notNullish = <T>(v: T | null | undefined): v is T =>
  v !== null && v !== undefined

export const falsy = <T>(v: T): v is PickFalsy<T> => !v

export const truthy = <T>(v: T): v is PickTruthy<T> => !!v

type PickFalsy<T> =
  | (null extends T ? null : never)
  | (undefined extends T ? undefined : never)
  | (false extends T ? false : never)
  | (0 extends T ? 0 : never)
  | ('' extends T ? '' : never)

type PickTruthy<T> =
  | (true extends T ? true : never)
  | (T extends string ? Exclude<T, ''> : never)
  | (T extends number ? Exclude<T, 0> : never)
  | Exclude<T, undefined | null | string | number | boolean>

export const isFulfilled = <T>(
  v: PromiseSettledResult<T>
): v is PromiseFulfilledResult<T> => v.status === 'fulfilled'

export const isRejected = (
  v: PromiseSettledResult<unknown>
): v is PromiseRejectedResult => v.status === 'rejected'
