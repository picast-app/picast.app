import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Screen, Surface } from 'components/structure'
import Appbar from 'components/Appbar'
import PodcastSearch from 'components/PodcastSearch'
import { Icon } from 'components/atoms'
import Show from './search/Show'
import { useHistory, useMatchMedia } from 'utils/hooks'
import { desktop, mobile } from 'styles/responsive'
import { gql, useQuery } from 'gql'
import type * as T from 'gql/types'
import { center } from 'styles/mixin'
import { Redirect } from 'react-router-dom'

const SEARCH_QUERY = gql`
  query SearchPodcast($query: String!) {
    search(query: $query) {
      id
      title
      author
      artwork
    }
  }
`

export default function Search() {
  useHistory()
  const isDesktop = useMatchMedia(desktop)
  const [results, setResults] = useState<T.SearchPodcast_search[]>([])
  const [term, setTerm] = useState<string>()
  const query = new URLSearchParams(location.search).get('q') ?? undefined

  const { variables, loading } = useQuery<
    T.SearchPodcast,
    T.SearchPodcastVariables
  >(SEARCH_QUERY, {
    variables: { query: query as string },
    skip: !query,
    onCompleted({ search }) {
      setResults(search)
    },
  })

  useEffect(() => {
    if (variables?.query) setTerm(variables.query)
  }, [variables])

  useEffect(() => {
    if (query) return
    setResults([])
    setTerm(undefined)
  }, [query])

  if (isDesktop && !query && !term) return <Redirect to="/discover" />
  return (
    <Screen loading={loading}>
      <Appbar back="/discover">
        <PodcastSearch />
      </Appbar>
      {term && (
        <Surface sc={S.ResultExpl}>
          Search results for "<span>{term}</span>"
        </Surface>
      )}
      {results?.length > 0 && (
        <S.Podcasts>
          <h2>Podcasts</h2>
          <S.Results>
            {results.map(v => (
              <Show key={v.id} {...v} />
            ))}
          </S.Results>
        </S.Podcasts>
      )}
      {results?.length === 0 && term && !loading && (
        <S.NoMatch>
          <Icon icon="search" />
          <span>No podcasts found for "{term}"</span>
        </S.NoMatch>
      )}
    </Screen>
  )
}

const S = {
  Podcasts: styled.div`
    @media ${mobile} {
      & > *:not(ul) {
        display: none;
      }
    }

    @media ${desktop} {
      margin: 0 1.5rem;
    }
  `,

  Results: styled.ul`
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;

    @media ${desktop} {
      flex-direction: row;
    }
  `,

  ResultExpl: styled.div`
    margin-bottom: 1rem;
    display: block;
    height: 2.5rem;
    width: 100%;
    padding: 0 1.5rem;
    line-height: 2.5rem;
    color: var(--cl-text-disabled);

    span {
      color: var(--cl-text);
    }

    @media ${mobile} {
      display: none;
    }
  `,

  NoMatch: styled.div`
    ${center}
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0.8;

    svg {
      width: 5rem;
      height: 5rem;
    }

    span {
      margin-top: 1.5rem;
    }
  `,
}
