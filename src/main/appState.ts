import { observable, autorun } from 'mobx'

type State = {
  user: {
    signInMethod?: 'google'
  }
  signedIn: boolean
}

export const state = observable<State>({
  user: { signInMethod: undefined },
  get signedIn() {
    return this.user.signInMethod !== undefined
  },
})

const resolvePath = <T = unknown>(
  path: string,
  node: any = state
): T | undefined => {
  const [prop, ...rest] = path.split('.')
  if (!rest.length) return node[prop]
  return resolvePath(rest.join('.'), node[prop])
}

const unknown = Symbol('unknown')

export const subscribe = <T = unknown>(
  path: string,
  handler: (v: T) => void
): (() => void) => {
  let last: string | undefined | typeof unknown = unknown
  return autorun(() => {
    const value = resolvePath(path)
    const str: string = JSON.stringify(value) as any
    if (str !== last) {
      last = str
      handler(JSON.parse(str))
    }
  })
}
