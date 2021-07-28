import { useState, useEffect } from 'react'
import { set, seg } from 'app/utils/path'
import type { Key, Value } from 'app/store/state'
import storeX from 'app/store/uiThread/api'

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
