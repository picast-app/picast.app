import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Screen, Surface } from 'components/structure'
import Appbar from 'components/Appbar'
import PodcastSearch from 'components/PodcastSearch'
import { Icon, Button } from 'components/atoms'
import { ShowCard } from 'components/composite'
import Show from './search/Show'
import { useHistory, useMatchMedia } from 'utils/hooks'
import { desktop, mobile } from 'styles/responsive'
import { gql, useQuery } from 'gql'
import type * as T from 'gql/types'
import { center } from 'styles/mixin'
import { Redirect } from 'react-router-dom'

const SEARCH_QUERY = gql`
  query SearchPodcast($query: String!) {
    search(query: $query, limit: 50) {
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
  const [showAll, setShowAll] = useState(false)
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
    <Screen loading={loading} style={S.Page}>
      <Appbar back="/discover">
        <PodcastSearch />
      </Appbar>
      {term && (
        <Surface sc={S.ResultExpl}>
          <h1>
            Search results for "<span>{term}</span>"
          </h1>
        </Surface>
      )}
      {results?.length > 0 && (
        <S.Podcasts>
          <S.PodHeader>
            <h2>Podcasts</h2>
            <Button text onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Collapse' : 'Show All'}
            </Button>
          </S.PodHeader>
          <S.RowWrap>
            <S.Results aria-expanded={showAll ? 'true' : 'false'}>
              {results.map(v => (
                <S.Item key={v.id}>
                  <ShowCard podcast={v} title strip={!isDesktop} />
                </S.Item>
              ))}
            </S.Results>
            {Array(10)
              .fill(0)
              .map((_, i) => (
                <S.ScrollStop key={`stop-${i}`} />
              ))}
          </S.RowWrap>
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

const maxCardSize = 250
const padding = 1.5 * 16
const maxColumns = 18
const sideBarWidth = 15 * 16

const maxWidth = (columns: number) =>
  columns * maxCardSize + (columns - 1) * padding + 2 * padding + sideBarWidth

const breakPoints = Array(10)
  .fill(4)
  .map((v, i) => v + i)
  .map(
    columns =>
      `@media (min-width: ${maxWidth(
        columns - 1
      )}px) { --columns: ${columns}; }`
  )

const RowWrap = styled.div`
  --columns: 3;
  --spacing: var(--padding);
  --max: ${maxColumns};

  position: relative;
  user-select: none;
  ${breakPoints.join('\n')}

  @media ${desktop} {
    margin: 0 calc(var(--padding) * -1);
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`

const S = {
  Page: styled.div`
    --padding: ${padding}px;
  `,

  PodHeader: styled.div`
    margin: var(--padding) 0;
    display: flex;
    align-items: center;

    h2 {
      font-size: 1.3rem;
    }

    button {
      margin-left: auto;
    }
  `,

  Podcasts: styled.div`
    @media ${mobile} {
      & > *:not(${RowWrap}) {
        display: none;
      }
    }

    @media ${desktop} {
      margin: var(--padding);
      margin-top: 0;
    }
  `,

  RowWrap,

  // prettier-ignore
  Results: styled.ol`
    @media ${desktop} {
      display: grid;
      grid-gap: var(--spacing);
      grid-template-columns: repeat(
        var(--max),
        calc(
          (100vw - var(--sidebar-width) - var(--padding) * 2 - (var(--columns) - 1) * var(--spacing)) / var(--columns)
        )
      );
      padding-left: var(--padding);

      &[aria-expanded='true'] {
        --max: var(--columns);
      }

      &[aria-expanded='false'] > *:nth-child(n+${maxColumns + 1}) {
        display: none;
      }

      &[aria-expanded='false'] > *:nth-child(${maxColumns})::after {
        content: '';
        position: absolute;
        width: var(--padding);
        height: 100%;
        left: 100%;
        top: 0;
      }
    }
  `,

  ResultExpl: styled.div`
    margin-bottom: 1rem;
    display: block;
    height: 2.5rem;
    width: 100%;
    padding: 0 1.5rem;

    h1 {
      color: var(--cl-text-disabled);
      line-height: 2.5rem;

      span {
        color: var(--cl-text);
      }
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

  ScrollStop: styled.div`
    display: block;
    flex-shrink: 0;
    width: 100%;
    height: 0;
    scroll-snap-align: end;
    position: absolute;

    --page: 0;

    left: calc(var(--page) * (100% - var(--padding)));
    ${Array(10)
      .fill(2)
      .map((v, i) => v + i)
      .map(i => `&:nth-of-type(${i}) { --page: ${i - 1}; }`)
      .join('\n')}
  `,

  Item: styled.li`
    position: relative;
  `,
}
