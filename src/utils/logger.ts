import * as ts from 'utils/time'

export default globalThis.logger = {}

const noop = () => {}
const print = (method: keyof typeof console, prefix: string = method) =>
  Function.prototype.bind.call(
    // eslint-disable-next-line no-console
    console[method],
    console,
    prefix && `[${prefix}]:`,
    `<${ts.log()}>`
  )

const fallback = (method: keyof typeof console) => {
  if (method !== 'assert') return noop
  return (cond: any, ...msg: string[]) => {
    if (cond) return
    throw Error('Assertion failed' + (msg.length ? `: ${msg.join(' ')}` : ''))
  }
}

function defineMethods(shouldPrint: boolean) {
  Object.defineProperties(
    logger,
    Object.fromEntries(
      (['info', 'warn', 'error'] as const).map(m => [
        m,
        {
          ...(shouldPrint ? { get: () => print(m) } : { value: fallback(m) }),
          configurable: true,
        },
      ])
    )
  )
}

defineMethods(process.env.NODE_ENV === 'development')

export const togglePrint = (v?: boolean) => {
  if (typeof v === 'boolean' && v !== (logger.info !== noop)) defineMethods(v)
}
