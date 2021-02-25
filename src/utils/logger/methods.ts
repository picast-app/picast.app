let print = process.env.NODE_ENV === 'development'

const devLog = <T extends keyof typeof console>(
  method: T,
  prefix: string = method
) =>
  Function.prototype.bind.call(
    // eslint-disable-next-line no-console
    console[method],
    console,
    prefix && `[${prefix}]:`
  )

const makeMethods = () => ({
  info: print ? devLog('info') : () => {},
  warn: print ? devLog('warn') : () => {},
  error: print ? devLog('error') : () => {},
  assert: print
    ? devLog('assert', undefined)
    : (cond: any) => {
        if (cond) return
        throw Error('assertion failed')
      },
})

const methods = makeMethods()
export default methods

export const togglePrint = (v?: boolean) => {
  if (typeof v !== 'boolean') return
  print = v
  Object.assign(methods, makeMethods())
}
