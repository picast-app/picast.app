import { useState, useEffect } from 'react'
import { main, proxy } from 'workers'
import type { Key, Value } from 'store'

export function useStateX<T extends Key>(key: Key) {
  const [value, setValue] = useState<Value<T>>()

  useEffect(() => {
    main.listenX(key, proxy(setValue) as any)
  }, [key])

  return value
}
