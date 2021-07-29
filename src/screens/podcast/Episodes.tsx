import React, { useCallback } from 'react'
import { EpisodeStrip } from 'components/composite'
import { VirtualList } from 'components/structure'
import { useFeed } from 'hooks'

type Props = {
  podcast: string
  total: number
  onLoading(v: boolean): void
}

export default function Episodes({ podcast, total }: Props) {
  const feed = useFeed(podcast)
  const props = useCallback((index: number) => ({ index, feed: feed! }), [feed])

  if (!feed) return null
  return (
    <VirtualList length={total} itemProps={props}>
      {EpisodeStrip}
    </VirtualList>
  )
}
