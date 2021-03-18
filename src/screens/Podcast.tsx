import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useAPICall } from 'utils/hooks'
import { Screen } from 'components/structure'
import Appbar from 'components/Appbar'
import type { RouteComponentProps } from 'react-router'
import Info from './podcast/Info'
import Feed from './podcast/Episodes'

export default function Podcast({
  match,
}: RouteComponentProps<{ id: string }>) {
  const [podcast, _loading] = useAPICall(
    'podcast',
    match.params.id.split('?')[0]
  )
  const [loading, setLoading] = useState(_loading)

  useEffect(() => {
    if (_loading) return setLoading(true)
    setLoading(podcast?.incomplete ?? false)
  }, [_loading, podcast?.incomplete])

  return (
    <Screen loading={loading}>
      <Appbar title={podcast?.title} back="/" />
      <S.Inner>
        <Info {...podcast} />
        <Feed
          id={match.params.id}
          total={podcast ? podcast.episodeCount : -1}
          onLoading={setLoading}
        />
      </S.Inner>
    </Screen>
  )
}

const S = {
  Inner: styled.div`
    --inner-width: 70rem;
    max-width: var(--inner-width);
    margin: auto;
  `,
}
