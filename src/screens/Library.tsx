import React from 'react'
import styled from 'styled-components'
import Appbar from 'components/Appbar'
import { ShowCard } from 'components/composite'
import { Screen } from 'components/structure'
import { useSubscriptions } from 'utils/hooks'

export default function Library() {
  const subs = useSubscriptions()

  console.log(subs)

  return (
    <Screen padd>
      <Appbar title="Podcasts" scrollOut />
      <S.Grid>
        {subs?.map(id => (
          <ShowCard id={id} key={id} />
        ))}
      </S.Grid>
    </Screen>
  )
}

const S = {
  Grid: styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 1rem;

    article[data-style] {
      width: 100%;
      height: 100%;
    }
  `,
}
