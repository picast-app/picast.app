import { useState, useEffect } from 'react'
import { set } from 'utils/path'
import type { Key, Value } from 'store/state'
import storeX from 'store/threadAPI'

export function useStateX<T extends Key>(key: T, ...subs: string[]) {
  const [value, setValue] = useState<Value<T>>()

  useEffect(() => {
    let cancel: boolean | (() => void) = false
    const l = key.length + subs.reduce((a, c) => a + (-1 + c.length), 0)
    storeX
      .listenX(
        key,
        (state, path) => {
          setValue(previous => {
            return set(previous, state, ...path.slice(l + 1).split('.'))
          })
        },
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

  return [value, { set: storeX.setX, merge: storeX.mergeX }] as const
}
