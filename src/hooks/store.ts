import { useState, useEffect } from 'react'
import { main, proxy } from 'workers'
import { set } from 'utils/path'
import type { Key, Value } from 'store/state'

export function useStateX<T extends Key>(key: T, ...subs: string[]) {
  const [value, setValue] = useState<Value<T>>()

  useEffect(() => {
    let cancel: boolean | (() => void) = false
    main
      .listenX(
        key,
        proxy((state: any, path: string) =>
          setValue((previous: any) => {
            return set(
              previous,
              state,
              ...path.slice(key.length + 1).split('.')
            )
          })
        ) as any,
        ...subs
      )
      .then(unsub => {
        if (cancel) unsub()
        else cancel = unsub
      })
    return () => {
      if (typeof cancel === 'function') cancel()
      else cancel = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...subs])

  return [value, { set: main.setX, merge: main.mergeX }] as const
}
