import React, { useState } from 'react'
import { useAPICall } from 'utils/hooks'
import { Screen } from 'components/structure'
import Appbar from 'components/Appbar'
import type { RouteComponentProps } from 'react-router'
import Info from './podcast/Info'
import Feed from './podcast/Episodes'

export default function Podcast({
  match,
}: RouteComponentProps<{ id: string }>) {
  const [podcast, _loading] = useAPICall('podcast', match.params.id)
  const [loading, setLoading] = useState(false)

  return (
    <Screen loading={_loading || loading}>
      <Appbar title={podcast?.title} back="/" />
      {podcast && (
        <>
          <Info {...podcast} />
          <Feed
            id={podcast.id}
            total={
              (podcast as any).episodes?.pageInfo?.total ?? podcast.episodeCount
            }
            onLoading={setLoading}
          />
        </>
      )}
    </Screen>
  )
}
