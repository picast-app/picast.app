import { main, proxy } from 'app/workers'
import { callAll } from 'app/utils/function'
import type { FlatState } from 'app/store/state'
import type { Setter } from 'app/store/core/storeX'

// instead of subscribing to the same storeX state through comlink multiple
// times, this interface exposes the same api but only sets up the subscription
// once for every requested path and cancels it once the last subscribers
// has cancelled the subscription

const paths: Record<
  string,
  { cbs: Setter<any>[]; last?: Parameters<Setter>; cancel?: Cancel }
> = {}

type Cancel = () => void

export const listen = <T extends keyof FlatState>(
  path: T,
  cb: Setter<FlatState[T]>,
  ...subs: string[]
): Cancel => {
  const key = [path, ...subs].join('|')
  if (key in paths) {
    paths[key].cbs.push(cb)
    if ('last' in paths[key]) cb(...paths[key].last!)
  } else {
    paths[key] = { cbs: [cb] }
    main
      .listenX(
        path as any,
        proxy((v, p) => {
          if (!(key in paths)) return
          paths[key].last = [v, p, {}]
          callAll(paths[key].cbs, ...paths[key].last!)
        }),
        ...subs
      )
      .then(cancel => {
        if (key in paths) paths[key].cancel = cancel
        else cancel()
      })
  }

  return () => {
    if (!paths[key]?.cbs.includes(cb)) return
    paths[key].cbs.splice(paths[key].cbs.indexOf(cb), 1)
    if (paths[key].cbs.length) return
    if (paths[key].cancel) paths[key].cancel!()
    delete paths[key]
  }
}
