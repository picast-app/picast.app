import React, { useState, useEffect, useCallback } from 'react'
import { EpisodeStrip } from 'components/composite'
import { VirtualList } from 'components/structure'
import { useFeed, useValueRef } from 'hooks'
import { main, proxy } from 'workers'

type Props = {
  podcast: string
  total?: number
  onLoading(v: boolean): void
}

export default function Episodes({ podcast, total, onLoading }: Props) {
  const feed = useFeed(podcast)
  const setLoading = useValueRef(onLoading)
  const [length, setLength] = useState(total ?? 100)

  useEffect(() => {
    main.onTotalChange(
      podcast,
      proxy(({ complete, total }) => {
        if (complete) setLoading.current(false)
        setLength(total)
      })
    )
  }, [podcast, setLoading])

  useEffect(() => {
    if (total) setLength(total)
  }, [total])

  const props = useCallback((index: number) => ({ index, feed: feed! }), [feed])

  if (!feed) return null
  return (
    <VirtualList length={length} itemProps={props}>
      {EpisodeStrip}
    </VirtualList>
  )
}
