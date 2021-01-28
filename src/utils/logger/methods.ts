const timeStamp = () =>
  `${['Hours', 'Minutes', 'Seconds']
    .map(n => `0${(new Date() as any)[`get${n}`]()}`.slice(-2))
    .join(':')}:${`00${new Date().getMilliseconds()}`.slice(-3)}`

let print = process.env.NODE_ENV === 'development'
const devNull = (...args: any) => void 0
const devLog = (method: keyof typeof console, prefix: string = method) =>
  print
    ? (() =>
        Function.prototype.bind.call(
          // eslint-disable-next-line no-console
          console[method],
          console,
          prefix && `[${prefix}]: <${timeStamp()}>`
        ))()
    : null

export const info = devLog('info') ?? devNull
export const warn = devLog('warn') ?? devNull
export const error = devLog('error') ?? devNull
export const assert =
  devLog('assert', undefined) ??
  ((cond: boolean) => {
    if (cond) return
    throw Error('assertion failed')
  })

export const togglePrint = (v: boolean) => {
  print = v
}
