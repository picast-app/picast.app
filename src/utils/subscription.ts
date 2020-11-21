export default function createSubscription<T>(
  setup?: ((...args: any[]) => ((...args: any[]) => any) | void) | T
): Subscription<T> {
  let subscribers: ((v: T) => void)[] = []
  let cleanup: ((...args: any[]) => any) | void
  const unsubscribe = (callback: (v: T) => void) => {
    subscribers = subscribers.filter(f => f !== callback)
    if (subscribers.length === 0 && cleanup) cleanup()
  }
  let _state: T
  if (typeof setup !== 'function') _state = setup as T
  return {
    subscribe(callback: (v: T) => void, ...setupArgs: any[]) {
      if (subscribers.length === 0 && typeof setup === 'function')
        cleanup = (setup as any)(...setupArgs)
      subscribers.push(callback)
      return () => unsubscribe(callback)
    },
    setState(v: T) {
      _state = v
      subscribers.forEach(f => f(v))
    },
    get requested() {
      return subscribers.length > 0
    },
    get state() {
      return _state
    },
  }
}

export type Subscription<T> = {
  state: T
  setState(v: T): void
  requested: boolean
  subscribe(callback: (v: T) => void): unsubscribe
}

type unsubscribe = () => void
