import React from 'react'
import { Screen } from 'app/components/structure'
import DocTree from 'app/components/DocTree'
import { useComputed, useAPICall } from 'app/hooks'

export default function FeedView() {
  const url = location.href.slice(`${location.origin}/feedview/`.length)
  const [feed, loading] = useAPICall('feed', url)

  const document = useComputed(
    feed?.raw,
    txt => txt && new DOMParser().parseFromString(txt, 'text/xml')
  )

  return (
    <Screen padd loading={loading}>
      {document && <DocTree document={document} />}
    </Screen>
  )
}
