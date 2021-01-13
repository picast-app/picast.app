const local = process.env.NODE_ENV
const devNull = (...args: any) => void 0
const devLog = (method: keyof typeof console, prefix: string = method) =>
  (() =>
    Function.prototype.bind.call(
      // eslint-disable-next-line no-console
      console[method],
      console,
      prefix && `[${prefix}]:`
    ))()

export const info = local ? devLog('info') : devNull
export const warn = local ? devLog('warn') : devNull
export const error = local ? devLog('error') : devNull
export const assert = local
  ? devLog('assert', undefined)
  : (cond: boolean) => {
      if (cond) return
      throw Error('assertion failed')
    }
