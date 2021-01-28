import React, { useState } from 'react'
import styled from 'styled-components'
import Appbar from 'components/Appbar'
import { ShowCard } from 'components/composite'
import { Screen } from 'components/structure'
import { useSubscriptions } from 'utils/hooks'
import { desktop } from 'styles/responsive'
import { snack } from 'utils/notification'
import { main } from 'workers'

export default function Library() {
  const [subs] = useSubscriptions()
  const [loading, setLoading] = useState(false)

  async function sync() {
    setLoading(true)
    const { added, removed } = await main.syncSubscriptions()
    const msg =
      added.length + removed.length === 0
        ? 'no changes in subscriptions found'
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
    </Screen>
  )
}

const cardPadd = 1.5 * 16
const sideBarWidth = 15 * 16

const maxWidth = (
  columns: number,
  maxCardSize: number,
  padding: number,
  sidePadd: number
) => columns * maxCardSize + (columns - 1) * padding + 2 * padding + sidePadd

const DESKTOP_MIN_WIDTH = 901

const desktopBreakPoints = Array(10)
  .fill(3)
  .map((v, i) => v + i)
  .map(
    columns =>
      `@media (min-width: ${Math.max(
        maxWidth(columns - 1, 256, cardPadd, sideBarWidth),
        DESKTOP_MIN_WIDTH
      )}px) { --columns: ${columns}; }`
  )

const mobilePts = Array(4)
  .fill(3)
  .map((v, i) => v + i)
  .map(columns => maxWidth(columns - 1, 180, 0, 0))

const mobileBreakPoints = mobilePts
  .filter(v => v < DESKTOP_MIN_WIDTH)
  .map(
    (v, i, { length }) =>
      `@media (min-width: ${v}px)${
        i < length - 1 ? '' : ` and (max-width: ${DESKTOP_MIN_WIDTH - 1}px)`
      } { --columns: ${3 + i} }`
  )

const S = {
  Grid: styled.div`
    --columns: 2;

    display: grid;
    grid-template-columns: repeat(var(--columns), 1fr);

    article[data-style] {
      width: 100%;
      height: 100%;
    }

    ${mobileBreakPoints.join('\n')}
    ${desktopBreakPoints.join('\n')}

    @media ${desktop} {
      grid-gap: ${cardPadd}px;
      padding: ${cardPadd}px;

      img {
        border-radius: 0.25rem;
      }
    }
  `,
}
