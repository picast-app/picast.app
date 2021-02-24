let print = process.env.NODE_ENV === 'development'

const devLog = <T extends keyof typeof console>(
  method: T,
  prefix: string = method,
  fallback?: (...args: Parameters<typeof console[T]>) => any
) =>
  print
    ? (() =>
        Function.prototype.bind.call(
          // eslint-disable-next-line no-console
          console[method],
          console,
          prefix && `[${prefix}]:`
        ))()
    : fallback

export const info = devLog('info')
export const warn = devLog('warn')
export const error = devLog('error')
export const assert = devLog('assert', undefined, cond => {
  if (cond) return
  throw Error('assertion failed')
})

export const togglePrint = (v?: boolean) => {
  if (typeof v !== 'boolean') return
  print = v
}
