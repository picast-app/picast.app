import React, { useState } from 'react'
import styled from 'styled-components'
import Appbar from 'components/Appbar'
import { ShowCard } from 'components/composite'
import { Screen } from 'components/structure'
import Glow from './library/Glow'
import { useSubscriptions, useMatchMedia, useTheme } from 'utils/hooks'
import { desktop } from 'styles/responsive'
import { snack } from 'utils/notification'
import { main } from 'workers'
import { cardPadd, mobileQueries, desktopQueries } from './library/grid'

export default function Library() {
  const [subs] = useSubscriptions()
  const [loading, setLoading] = useState(false)
  const isDesktop = useMatchMedia(desktop)
  const theme = useTheme()

  async function sync() {
    setLoading(true)
    const { added, removed } = await main.syncSubscriptions()
    const msg =
      added.length + removed.length === 0
        ? 'no changes to subscriptions found'
        : [
            added.length &&
              'added ' +
                (added.length > 1
                  ? `${added.length} podcasts`
                  : `"${added[0]}"`),
            removed.length &&
              'removed ' +
                (removed.length > 1
                  ? `${removed.length} podcasts`
                  : `"${removed[0]}"`),
          ]
            .filter(Boolean)
            .join(' and ')
    snack({ text: msg[0].toUpperCase() + msg.slice(1) + '.' })
    setLoading(false)
  }

  return (
    <Screen refreshAction={sync} loading={loading}>
      <Appbar title="Podcasts" scrollOut />
      <S.Grid>
        {subs?.map(id => (
          <ShowCard id={id} key={id} />
        ))}
      </S.Grid>
      {isDesktop && theme !== 'light' && <Glow />}
    </Screen>
  )
}

const S = {
  Grid: styled.div`
    --columns: 2;

    display: grid;
    grid-template-columns: repeat(var(--columns), 1fr);

    article[data-style] {
      width: 100%;
      height: 100%;
    }

    ${mobileQueries.join('\n')}
    ${desktopQueries.join('\n')}

    @media ${desktop} {
      grid-gap: ${cardPadd}px;
      padding: ${cardPadd}px;
    }

    img {
      transition: filter 0.15s ease, box-shadow 0.15s ease;
      --shadow-cl: #fff4;

      html[data-theme='light'] & {
        --shadow-cl: #0008;
      }
    }

    img:hover {
      filter: saturate(120%) brightness(110%);
      box-shadow: 0 0 6px 0 var(--shadow-cl);
    }
  `,
}
