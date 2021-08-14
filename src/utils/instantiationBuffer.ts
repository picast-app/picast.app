import { isPromise } from 'utils/promise'

type Methods<T> = {
  [K in keyof T]: T[K] extends λ ? K : never
}[keyof T]

type BufferReturn<T> = T extends PromiseLike<any> ? T : PromiseLike<T>

type InstanceBuffer<T> = {
  [K in Methods<T>]: (
    ...args: Parameters<T[K]>
  ) => BufferReturn<ReturnType<T[K]>>
}

export default <T extends new (...args: any) => any>(
  constr: T,
  instanceProm: Promise<InstanceType<T>>
): InstanceBuffer<InstanceType<T>> => {
  const methods = Object.getOwnPropertyNames(constr.prototype).filter(
    name => constr.prototype[name] !== constr.prototype.constructor
  )

  const invocations: Record<
    string,
    { args: any[]; callback: (v: any) => void }[]
  > = {}

  let instance: InstanceType<T> | undefined = undefined

  const buffer: InstanceBuffer<InstanceType<T>> = Object.fromEntries(
    methods.map(name => {
      invocations[name] = []
      return [
        name,
        (...args: any[]) => {
          if (instance) return instance[name](...args)
          let callback: (v: any) => void
          const prom = new Promise(res => {
            callback = res
          })
          invocations[name].push({ args, callback: callback! })
          return prom
        },
      ]
    })
  ) as any

  instanceProm.then(inst => {
    instance = inst
    for (const [method, invs] of Object.entries(invocations)) {
      for (const { args, callback } of invs) {
        const res = inst[method](...args)
        if (isPromise(res)) res.then((v: any) => callback(v))
        else callback(res)
      }
    }
  })

  return buffer
}
