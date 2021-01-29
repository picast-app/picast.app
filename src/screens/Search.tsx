import React, { useState } from 'react'
import styled from 'styled-components'
import {
  Screen,
  Surface,
  ExpandoGrid,
  ExpandoSC,
  Helmet,
} from 'components/structure'
import { ShowCard } from 'components/composite'
import { Icon, Button } from 'components/atoms'
import Appbar from 'components/Appbar'
import PodcastSearch from 'components/PodcastSearch'
import { useHistory, useMatchMedia, useAPICall } from 'utils/hooks'
import { desktop, mobile } from 'styles/responsive'
import { center } from 'styles/mixin'
import { Redirect } from 'react-router-dom'

export default function Search() {
  useHistory()
  const isDesktop = useMatchMedia(desktop)
  const [showAll, setShowAll] = useState(false)
  const query = new URLSearchParams(location.search).get('q') ?? undefined

  const [data, loading, [term] = []] = useAPICall('search', query)
  const results = query ? data : []

  if (isDesktop && !query) return <Redirect to="/discover" />
  return (
    <Screen loading={loading} style={S.Page}>
      <Helmet title={(query && term) ?? 'Search'} join={query && term && '-'} />
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
      {(results?.length ?? 0) > 0 && (
        <S.Podcasts>
          <S.PodHeader>
            <h2>Podcasts</h2>
            <Button text onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Collapse' : 'Show All'}
            </Button>
          </S.PodHeader>
          <ExpandoGrid list={!isDesktop} expanded={showAll}>
            {results?.map(v => (
              <ShowCard key={v.id} podcast={v} title strip={!isDesktop} />
            ))}
          </ExpandoGrid>
        </S.Podcasts>
      )}
      {results?.length === 0 && query && !loading && (
        <S.NoMatch>
          <Icon icon="search" />
          <span>No podcasts found for "{term}"</span>
        </S.NoMatch>
      )}
    </Screen>
  )
}

const padding = 1.5 * 16

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
      & > *:not(${ExpandoSC}) {
        display: none;
      }
    }

    @media ${desktop} {
      margin: var(--padding);
      margin-top: 0;
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
}
