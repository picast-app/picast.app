import React, { useState } from 'react'
import styled from 'styled-components'
import { Screen } from 'components/structure'
import Appbar from 'components/Appbar'
import PodcastSearch from 'components/PodcastSearch'
import type * as T from 'gql/types'
import Show from './search/Show'

export default function Search() {
  const [results, setResults] = useState<T.SearchPodcast_search[]>([])
  const [loading, setLoading] = useState(false)

  return (
    <Screen loading={loading}>
      <Appbar back="/discover">
        <PodcastSearch
          onResults={(res, q) => setResults(res)}
          onLoading={setLoading}
        />
      </Appbar>
      <S.Results>
        {results.map(v => (
          <Show key={v.id} {...v} />
        ))}
      </S.Results>
    </Screen>
  )
}

const S = {
  Results: styled.ul``,
}
