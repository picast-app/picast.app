import { asyncQueue as aq } from './promise'
import { wrap } from 'utils/profile'

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

export const time: MethodDecorator = (
  target,
  key,
  descriptor: PropertyDescriptor
) => {
  descriptor.value = wrap(descriptor.value, `${target.constructor.name}.`)
}
