import * as ts from 'utils/time'

// eslint-disable-next-line no-console
export default globalThis.logger = { assert: console.assert }

const noop = () => {}
const print = (method: keyof typeof console, prefix: string = method) =>
  Function.prototype.bind.call(
    // eslint-disable-next-line no-console
    console[method],
    console,
    prefix && `[${prefix}]:`,
    `<${ts.log()}>`
  )

function defineMethods(shouldPrint: boolean) {
  Object.defineProperties(
    logger,
    Object.fromEntries(
      (['info', 'warn', 'error'] as const).map(m => [
        m,
        {
          ...(shouldPrint ? { get: () => print(m) } : { value: noop }),
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
