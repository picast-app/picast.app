import createSub, { Subscription } from 'utils/subscription'

const store: Record<string, Subscription<any>> = {}

export function querySub<T = boolean>(query: string): Subscription<T> {
  const sub = (store[query] ??= createSub<T>(() => {
    logger.info('setup query', query)
    const mql = window.matchMedia(query)
    sub.setState(mql.matches)

    const onChange = ({ matches }: MediaQueryListEvent) => {
      sub.setState(matches)
    }

    mql.addEventListener('change', onChange)
    return () => {
      logger.info('stop query', query)
      mql.removeEventListener('change', onChange)
      delete store[query]
    }
  }))
  return sub
}

export function queryValue<T = boolean>(query: string) {
  const sub = querySub<T>(query)

  const obj = {
    current: sub.state,
    cancel: sub.subscribe(v => {
      obj.current = v
    }),
  }
  obj.current = sub.state

  return obj
}
