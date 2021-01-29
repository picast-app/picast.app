const timeStamp = () =>
  `${['Hours', 'Minutes', 'Seconds']
    .map(n => `0${(new Date() as any)[`get${n}`]()}`.slice(-2))
    .join(':')}:${`00${new Date().getMilliseconds()}`.slice(-3)}`

let print = process.env.NODE_ENV === 'development'

const devLog = <T extends keyof typeof console>(
  method: T,
  prefix: string = method,
  fallback?: (...args: Parameters<typeof console[T]>) => any
) => {
  const func = (() =>
    Function.prototype.bind.call(
      // eslint-disable-next-line no-console
      console[method],
      console,
      prefix && `[${prefix}]: <${timeStamp()}>`
    ))()

  return (...args: Parameters<typeof console[T]>) =>
    print ? func(...args) : undefined
}

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
