import { main, proxy } from 'workers'
import { callAll } from 'utils/function'
import type { FlatState } from './state'
import type { Setter } from './storeX'

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
    logger.info('start', key)
    paths[key] = { cbs: [cb] }
    main
      .listenX(
        path as any,
        proxy((v, p) => {
          if (!(key in paths)) return
          paths[key].last = [v, p, {}]
          callAll(paths[key].cbs, ...paths[key].last!)
        })
      )
      .then(cancel => {
        if (key in paths) paths[key].cancel = cancel
        else cancel()
      })
  }

  return () => {
    paths[key].cbs.splice(paths[key].cbs.indexOf(cb), 1)
    if (paths[key].cbs.length) return
    logger.info('stop', key)
    if (paths[key].cancel) paths[key].cancel!()
    delete paths[key]
  }
}
