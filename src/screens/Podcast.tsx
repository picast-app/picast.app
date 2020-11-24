import React from 'react'
import { useAsyncCall } from 'utils/hooks'
import { Screen } from 'components/structure'
import Appbar from 'components/Appbar'
import type { RouteComponentProps } from 'react-router'
import Info from './podcast/Info'
import Feed from './podcast/Episodes'
import { main } from 'workers'

export default function Podcast({
  match,
}: RouteComponentProps<{ id: string }>) {
  const podcast = useAsyncCall(main.podcast, match.params.id)

  return (
    <Screen loading={!podcast}>
      <Appbar title={podcast?.title} back="/" />
      <Info {...(podcast ?? {})} />
      <Feed episodes={podcast?.episodes ?? []} />
    </Screen>
  )
}
