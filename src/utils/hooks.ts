import { useState, useEffect, useContext } from 'react'
import { Theme } from 'styles'

export const useTheme = () => useContext(Theme)

export function useMatchMedia(query: string) {
  const [match, setMatch] = useState(true)

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
