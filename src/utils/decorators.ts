import { asyncQueue as aq } from './promise'

export const asyncQueue: MethodDecorator = (
  target,
  key,
  descriptor: PropertyDescriptor
) => {
  const org = descriptor.value
  const queue = aq((self, ...args: any) => org.call(self, ...args))
  descriptor.value = function (...args: any[]) {
    return queue(this, ...args)
  }
}
