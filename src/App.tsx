import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import Routes from './Routes'
import Mainnav from 'components/Mainnav'
import { Player, DesktopEpisodeInfo } from 'components/composite'
import { SnackTray } from 'components/structure'
import { Theme } from 'styles'
import { desktop } from 'styles/responsive'
import { HelmetProvider, Helmet } from 'react-helmet-async'
import { Route } from '@picast-app/router'

export default function App() {
  const [isDarkMode, setDarkMode] = useState(
    document.documentElement.dataset.theme === 'dark'
  )

  useEffect(() => {
    new MutationObserver(() => {
      const theme = document.documentElement.dataset.theme
      logger.info('set theme to ' + theme)
      setDarkMode(theme === 'dark')
    }).observe(document.documentElement, {
      childList: false,
      attributes: true,
      attributeFilter: ['data-theme'],
    })
  }, [])

  return (
    <HelmetProvider>
      <Theme.Provider value={isDarkMode ? 'dark' : 'light'}>
        <S.App>
          <Helmet>
            <title>Picast</title>
          </Helmet>
          <Player />
          <Routes />
          <SnackTray />
          <Mainnav />
          <Route path="?info">{DesktopEpisodeInfo}</Route>
        </S.App>
      </Theme.Provider>
    </HelmetProvider>
  )
}

const S = {
  App: styled.div`
    height: 100%;

    @media ${desktop} {
      display: flex;
      flex-direction: row-reverse;
      justify-content: flex-end;
    }
  `,
}
