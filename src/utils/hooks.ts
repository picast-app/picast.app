import {
  useState,
  useEffect,
  useContext,
  useReducer,
  useRef,
  useCallback,
} from 'react'
import { Theme } from 'styles'
import subscription, { Subscription } from './subscription'
import throttle from 'lodash/throttle'
import { main, subscriptionSub, state as appState } from 'workers'
import { isPromise } from 'utils/promise'
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
  const init = useRef(false)

  useEffect(() => {
    if (init.current) setComputed(compute(v))
    init.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comp])

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

export const useSubscription = <T>(
  sub: Subscription<T>
): [T, (v: T) => void] => [
  useSubscriptionValue(sub),
  useCallback((v: T) => sub.setState(v), [sub]),
]

export function useSubscriptionValue<T>(sub: Subscription<T>): T {
  const [v, setV] = useState<T>(sub.state)
  useEffect(() => (setV(sub.state), sub.subscribe(setV)), [sub])
  return v
}

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
  subscriptions: Podcast[],
  subscribe: (v: Podcast) => void,
  unsubscribe: (v: string) => void
] {
  const [subs, set] = useSubscription(subscriptionSub)

  function subscribe(podcast: Podcast) {
    if (subs.find(({ id }) => id === podcast.id)) return
    set([...subs, podcast])
    main.addSubscription(podcast.id, false)
  }

  function unsubscribe(id: string) {
    if (!subs.find(pod => pod.id === id)) return
    set(subs.filter(v => v.id !== id))
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
      cancel = await appState(path, set)
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

export function useEvent<
  T extends HTMLElement,
  E extends keyof HTMLElementEventMap
>(
  ref: T | null | undefined,
  event: E,
  handler: (e: HTMLElementEventMap[E] & { currentTarget: T }) => any,
  opts?: AddEventListenerOptions
) {
  useEffect(() => {
    if (!ref) return
    ref.addEventListener(event, handler as any, opts)
    return () => ref.removeEventListener(event, handler as any)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])
}

export function useCustomTheme(
  colors: Exclude<Podcast['palette'], undefined> = {} as any,
  target: HTMLElement | null = document.body
) {
  const theme = useTheme()

  useEffect(() => {
    if (!colors.darkVibrant || !colors.lightVibrant || !target) return

    target.style.setProperty(
      '--cl-primary',
      theme === 'light' ? colors.darkVibrant : colors.lightVibrant
    )
    const select = theme === 'light' ? colors.lightMuted : colors.darkMuted
    if (select) target.style.setProperty('--cl-select', select)

    return () => {
      target.style.removeProperty('--cl-primary')
    }
  }, [colors, theme, target])
}

type Dimensions<T = true> = [
  width: number | (T extends true ? null : number),
  height: number | (T extends true ? null : number)
]
const nullDim: Dimensions = [null, null]

export function useDimensions(element: HTMLElement | null): Dimensions {
  let initial: Dimensions = nullDim
  const [observer] = useState(
    new ResizeObserver(
      ([
        {
          contentRect: { width, height },
        },
      ]) => {
        if (!initial) initial = [width, height]
        else setDimensions([width, height])
      }
    )
  )

  useEffect(() => {
    if (!element) return
    observer.observe(element)
    return () => observer.disconnect()
  }, [element, observer])

  const [dimensions, setDimensions] = useState(initial!)

  return element ? dimensions : nullDim
}

export function useWindowDimensions(): Dimensions<false> {
  const [dimensions, setDimensions] = useState<Dimensions<false>>([
    window.innerWidth,
    window.innerHeight,
  ])

  useEffect(() => {
    const onResize = () => {
      setDimensions([window.innerWidth, window.innerHeight])
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return dimensions
}

export function useValueRef<T>(value: T) {
  const ref = useRef(value)
  ref.current = value
  return ref
}

export function useCallbackRef(cb: (el: HTMLElement) => () => void) {
  const cleanup = useRef<ReturnType<typeof cb> | null>(null)
  return useCallback(
    (node: HTMLElement | null) => {
      cleanup.current?.()
      cleanup.current = node ? cb(node) : null
    },
    [cb]
  )
}

const artCache: Record<string, Promise<string[]> | string[]> = {}
const artworks = (podcast: string) => {
  return (artCache[podcast] ??= fetchArt(podcast))
}
const fetchArt = async (id: string) =>
  (artCache[id] = (await main.podcast(id))?.covers ?? [])
export const useArtwork = (podcast: string) => {
  const [covers, setCovers] = useState<string[]>(
    isPromise(artCache[podcast]) ? [] : (artCache[podcast] as string[])
  )

  useEffect(() => {
    const v = artworks(podcast)
    if (isPromise(v)) v.then(setCovers)
  }, [podcast])
  return covers
}

export function useChanged(cb: Parameters<typeof useEffect>[0], deps?: any[]) {
  const init = useRef(false)
  useEffect(() => {
    if (!init.current) {
      init.current = true
      return
    }
    return cb()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
