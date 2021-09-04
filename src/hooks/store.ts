import { useState, useEffect } from 'react'
import { set, seg } from 'utils/path'
import type { Key, Value } from 'store/state'
import storeX from 'store/uiThread/api'

export function useStateX<T extends Key>(key: T, ...subs: string[]) {
  const [value, setValue] = useState<Value<T>>()

  useEffect(
    () =>
      storeX.listenX(
        key,
        (state, path) =>
          setValue(previous => set(previous, state, ...seg(path, 0, key))),
        ...subs
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, ...subs]
  )

  return [value, { set: storeX.setX, merge: storeX.mergeX }] as const
}

export function useJoinedX<T extends Key, K extends Key>(on: T, key: K) {
  const [value, setValue] = useState<CondArr<Value<T>, Value<K>>>()
  useEffect(() => storeX.listenJoinedX(on, key, v => setValue(v)), [on, key])
  return value
}
