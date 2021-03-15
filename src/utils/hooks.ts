import {
  useState,
  useEffect,
  useContext,
  useReducer,
  useRef,
  useCallback,
} from 'react'
import { Theme } from 'styles'
import createSubscription from './subscription'
import subscription, { Subscription } from './subscription'
import throttle from 'lodash/throttle'
import { main, subscriptionSub, proxy } from 'workers'
import type { API } from 'main/main.worker'

export { useHistory, useLocation } from 'react-router-dom'
export const useTheme = () => useContext(Theme)

export function useMatchMedia(query: string) {
  const [match, setMatch] = useState(window.matchMedia(query).matches)

  const handleEvent = (e: MediaQueryListEvent | MediaQueryList) =>
    setMatch(e.matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    handleEvent(mql)
    mql.onchange = handleEvent

    return () => {
      mql.onchange = null
    }
  })

  return match
}

type ScrollDir = 'up' | 'down'
type ScrollDirProps = {
  target?: HTMLElement
}
export function useScrollDir({
  target = document.documentElement,
}: ScrollDirProps): ScrollDir | undefined {
  const [dir, setDir] = useState<ScrollDir>()

  useEffect(() => {
    if (!target) return

    let lastY = target.scrollTop
    let lastDir: ScrollDir

    const onScroll = ({ target }: Event) => {
      if (!target) return
      const y = (target as HTMLElement).scrollTop
      const dy = y - lastY
      const dir = dy > 0 ? 'down' : 'up'
      if (dir !== lastDir) {
        lastDir = dir
        setDir(dir)
      }
      lastY = y
    }

    target.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      target?.removeEventListener('scroll', onScroll)
      setDir(undefined)
    }
  }, [target])

  return dir
}

export function useScrollPos(
  target: HTMLElement | null | undefined,
  rate = 50
) {
  const [pos, setPos] = useState(target?.scrollTop ?? 0)

  useEffect(() => {
    if (!target) return

    const onScroll = throttle(
      ({ target }: Event) => {
        setPos((target as HTMLElement).scrollTop)
      },
      rate,
      { leading: false, trailing: true }
    )

    target.addEventListener('scroll', onScroll, { passive: true })

    return () => target.removeEventListener('scroll', onScroll)
  }, [target, rate])

  return pos
}

export function useComputed<T, K>(
  v: T,
  compute: (v: T) => K,
  strategy: 'shallow' | 'json' = 'shallow'
): K {
  const [computed, setComputed] = useState<K>(() => compute(v))
  const comp = strategy === 'shallow' ? v : JSON.stringify(v)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!initialized) return
    setComputed(compute(v))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comp])

  useEffect(() => {
    setInitialized(true)
  }, [])

  return computed
}

export function useDebouncedInputCall<T>(
  input: T,
  { initial = input, inputDelay = 3, maxDelay = 300 } = {}
) {
  const [lastInput, setLastInput] = useState(input)
  const [inputStamps, setInputStamps] = useReducer(
    (c: number[], v: number | undefined) =>
      v === undefined ? [] : [...c, ...(Array.isArray(v) ? v : [v])],
    []
  )
  const [cancelGo, setCancelGo] = useState<ReturnType<typeof setTimeout>>()
  const [debounced, setDebounced] = useState(initial)

  const setInputStampsRef = useRef(setInputStamps)
  setInputStampsRef.current = setInputStamps
  const setDebouncedRef = useRef(setDebounced)
  setDebouncedRef.current = setDebounced
  const inputRef = useRef(input)
  inputRef.current = input

  useEffect(() => {
    if (input === lastInput) return
    setInputStamps(performance.now())
    setLastInput(input)
  }, [input, lastInput])

  useEffect(() => {
    if (cancelGo) clearTimeout(cancelGo)
    if (!inputStamps.length) return

    const inputDelta = inputStamps.slice(1).map((v, i) => v - inputStamps[i])
    const inputAvg = inputDelta.reduce((a, c) => a + c, 0) / inputDelta.length

    setCancelGo(
      setTimeout(
        () => {
          setInputStampsRef.current(undefined)
          setDebouncedRef.current(inputRef.current)
        },
        isNaN(inputAvg) ? maxDelay : Math.min(inputAvg * inputDelay, maxDelay)
      )
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputStamps])

  return debounced
}

const navbarWidgets = subscription<JSX.Element[]>()

export function useNavbarWidget(widget?: JSX.Element) {
  const [widgets, setWidgets] = useSubscription(navbarWidgets)

  useEffect(() => {
    const el = widget
    if (!el) return
    setWidgets([...(widgets ?? []), el])
    return () => navbarWidgets.setState(widgets?.filter(v => v !== el))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return widgets
}

export function useSubscription<T>(sub: Subscription<T>): [T, (v: T) => void] {
  const [v, setV] = useState<T>(sub.state)
  useEffect(() => (setV(sub.state), sub.subscribe(setV)), [sub])

  const set = useCallback((v: T) => sub.setState(v), [sub])

  return [v, set]
}

const visibility = createSubscription(document.visibilityState)
document.addEventListener('visibilitychange', () => {
  visibility.setState(document.visibilityState)
})

export const useVisibility = () => useSubscription(visibility)[0]

export function useCanvas(
  canvas?: HTMLCanvasElement | null,
  { desynchronized = false }: CanvasRenderingContext2DSettings = {}
): [
  context: CanvasRenderingContext2D | undefined,
  width: number,
  height: number
] {
  const [ctx, setCtx] = useState<CanvasRenderingContext2D>()
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resize = useCallback(
    throttle(
      (canvas: HTMLCanvasElement) => {
        const width = canvas.offsetWidth * devicePixelRatio
        const height = canvas.offsetHeight * devicePixelRatio
        canvas.width = width
        canvas.height = height
        setWidth(width)
        setHeight(height)
      },
      250,
      { leading: true, trailing: true }
    ),
    []
  )

  const [observer] = useState(
    new ResizeObserver(([{ target }]) => {
      resize(target as HTMLCanvasElement)
    })
  )

  useEffect(() => {
    if (!canvas) {
      setCtx(undefined)
      setWidth(0)
      setHeight(0)
      return
    }

    setCtx(canvas.getContext('2d', { desynchronized }) ?? undefined)

    observer.observe(canvas)

    return () => observer.disconnect()
  }, [canvas, observer, desynchronized])

  return [ctx, width, height]
}

export function useAsyncCall<T, K extends any[]>(
  func: (...args: any[]) => Promise<T>,
  ...args: K
): T | undefined {
  const [value, setValue] = useState<T>()

  useEffect(() => {
    func(...args).then(setValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, args)

  return value
}

type MapToOptional<T> = { [K in keyof T]: T[K] | undefined }
type Arr<T> = T extends any[] ? T : []

export function useAPICall<
  T extends FilterKeys<API, (...v: any[]) => Promise<any>>,
  P = Parameters<API[T]>,
  R = PromType<ReturnType<API[T]>>
>(
  opts: T | { method: T },
  ...args: Arr<MapToOptional<Parameters<API[T]>>>
): [data: R | undefined, loading: boolean, args: P] {
  const [value, setValue] = useState<R>()
  const [loading, setLoading] = useState(args.every(v => v !== undefined))
  const [params, setParams] = useState<P>()

  useEffect(() => {
    if (args.some(v => v === undefined)) return
    setLoading(true)
    // @ts-ignore
    main[typeof opts === 'string' ? opts : opts.method](...args).then(
      (v: R) => {
        setValue(v)
        setLoading(false)
        setParams((args as unknown) as P)
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, args)

  return [value as any, loading, params as P]
}

export function useFeed(...podcasts: string[]) {
  const [id, setId] = useState<string>()
  const dep = useComputed(podcasts, v => Array.from(new Set(v)), 'json')

  useEffect(() => {
    let id: string
    main.feedSubscription(...dep).then(v => {
      id = v
      setId(v)
    })
    return () => {
      if (id) main.cancelFeedSubscription(id)
    }
  }, [dep])

  return id
}

export function useSubscriptions(): [
  subscriptions: string[],
  subscribe: (v: string) => void,
  unsubscribe: (v: string) => void
] {
  const [subs, set] = useSubscription(subscriptionSub)

  function subscribe(id: string) {
    if (subs.includes(id)) return
    set([...subs, id])
    main.addSubscription(id, false)
  }

  function unsubscribe(id: string) {
    if (!subs.includes(id)) return
    set(subs.filter(v => v !== id))
    main.removeSubscription(id, false)
  }

  return [subs, subscribe, unsubscribe]
}

export function useIDBState<T>(
  key: string
): [T | undefined, (v: T) => void, boolean] {
  const [state, setState] = useState<T>()
  const [loading, setLoading] = useState(true)
  const setter = useComputed(key, key => (v: T) => {
    setState(v)
    main.idbPut('meta', key, v)
  })

  useEffect(() => {
    main.idbGet('meta', key).then((v: T) => {
      setState(v)
      setLoading(false)
    })
  }, [key])

  return [state, setter, loading]
}

type _AS<T> = { loading: boolean; state: T | undefined }

const equals = (a: any, b: any) => {
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  return ka.every(k => a[k] === b[k])
}

export function useAppState<T = unknown>(path: string) {
  const [{ loading, state }, setState] = useReducer(
    (state: _AS<T>, update: Partial<_AS<T>>) => {
      const merged = { ...state, ...update }
      return equals(state, merged) ? state : merged
    },
    { loading: true, state: undefined }
  )

  useEffect(() => {
    setState({ loading: true, state: undefined })
    let cancelled = false
    let cancel: (() => void) | undefined = undefined

    const init = async () => {
      const set = (v: unknown) => {
        if (cancelled) return
        setState({ state: v as T, loading: false })
      }
      cancel = await main.state(path, proxy(set))
      if (cancelled) return cancel()
    }
    init()

    return () => {
      cancelled = true
      cancel?.()
    }
  }, [path])

  return [state, loading] as const
}
