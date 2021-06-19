import React, { useState } from 'react'
import styled from 'styled-components'
import Appbar from 'components/Appbar'
import { Icon } from 'components/atoms'
import { ShowCard } from 'components/composite'
import { Screen } from 'components/structure'
import Glow from './library/Glow'
import { useMatchMedia, useTheme, useStateX } from 'hooks'
import { desktop } from 'styles/responsive'
import { snack } from 'utils/notification'
import { main } from 'workers'
import { cardPadd, mobileQueries, desktopQueries } from './library/grid'

export default function Library() {
  const isDesktop = useMatchMedia(desktop)
  const theme = useTheme()
  const [fullscreen, toggleFullscreen] = useFullscreen()
  const [pull, loading] = usePullSubs()
  const [library] = useStateX('library')

  return (
    <Screen refreshAction={pull} loading={loading}>
      <Appbar title="Podcasts" scrollOut>
        <S.FSWrap>
          <Icon
            icon={fullscreen ? 'minimize' : 'maximize'}
            label="fullscreen"
            onClick={toggleFullscreen}
          ></Icon>
        </S.FSWrap>
      </Appbar>
      <S.Grid>
        {library?.list.map(pod => (
          <ShowCard podcast={pod} key={pod.id} eager />
        ))}
      </S.Grid>
      {isDesktop && (theme !== 'light' || !library?.list?.length) && <Glow />}
    </Screen>
  )
}

function usePullSubs() {
  const [loading, setLoading] = useState(false)

  async function sync() {
    setLoading(true)
    const subs = await main.pullSubscriptions()
    if (!subs) {
      snack({ text: 'not signed in' })
    } else {
      const { added, removed } = subs
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
    }
    setLoading(false)
  }

  return [sync, loading] as const
}

function useFullscreen() {
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement)

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setFullscreen(true)
    }
  }

  return [fullscreen, toggle] as const
}

const queries = [...mobileQueries, ...desktopQueries].map(
  ([q, c]) => `${q} { --columns: ${c}; }`
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

    ${queries.join('\n')}

    @media ${desktop} {
      grid-gap: ${cardPadd}px;
      padding: ${cardPadd}px;
    }

    img {
      transition: filter 0.15s ease, box-shadow 0.15s ease;
      --shadow-cl: #fff4;

      html[data-theme='light'] & {
        --shadow-cl: #0008;

        &:not(:hover) {
          box-shadow: 0 0 0.2rem #0004;
        }
      }
    }

    img:hover {
      filter: saturate(120%) brightness(110%);
      box-shadow: 0 0 6px 0 var(--shadow-cl);
    }
  `,

  FSWrap: styled.div`
    height: 24px;

    @media not all and (display-mode: browser) {
      display: none;
    }
  `,
}
