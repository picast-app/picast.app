import React from 'react'
import { useAPICall } from 'utils/hooks'
import { Screen } from 'components/structure'
import Appbar from 'components/Appbar'
import type { RouteComponentProps } from 'react-router'
import Info from './podcast/Info'
import Feed from './podcast/Episodes'

export default function Podcast({
  match,
}: RouteComponentProps<{ id: string }>) {
  const [podcast, loading] = useAPICall('podcast', match.params.id)

  return (
    <Screen loading={loading}>
      <Appbar title={podcast?.title} back="/" />
      {podcast && (
        <>
          <Info {...podcast} />
          <Feed id={podcast.id} total={podcast.episodes.pageInfo.total} />
        </>
      )}
    </Screen>
  )
}
