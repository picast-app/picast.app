import { observable, autorun } from 'mobx'
import dbProm from './store/idb'

type State = {
  user: {
    provider?: 'google'
  }
  signedIn: boolean
  signOut(): void
  signIn(v: { provider: 'google' }): void
}

async function init(): Promise<{
  state: State
  subscribe: <T = unknown>(path: string, handler: (v: T) => void) => () => void
}> {
  const state = observable<State>({
    user: { provider: undefined },
    get signedIn() {
      return this.user.provider !== undefined
    },
    signOut() {
      this.user.provider = undefined
    },
    signIn(data) {
      Object.assign(this.user, data)
    },
  })

  const signin = await (await dbProm).get('meta', 'signin')
  if (signin) state.signIn(signin)

  const resolvePath = <T = unknown>(
    path: string,
    node: any = state
  ): T | undefined => {
    const [prop, ...rest] = path.split('.')
    if (!rest.length) return node[prop]
    return resolvePath(rest.join('.'), node[prop])
  }
  const unknown = Symbol('unknown')

  return {
    state,
    subscribe(path, handler) {
      let last: string | undefined | typeof unknown = unknown
      return autorun(() => {
        const value = resolvePath(path)
        const str: string = JSON.stringify(value) as any
        if (str !== last) {
          last = str
          handler(JSON.parse(str))
        }
      })
    },
  }
}
export default init()
