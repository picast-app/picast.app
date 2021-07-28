import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import Routes from 'app/Routes'
import Mainnav from 'app/components/Mainnav'
import { Player } from 'app/components/composite'
import { SnackTray } from 'app/components/structure'
import { Theme } from 'app/styles'
import { desktop } from 'app/styles/responsive'
import { HelmetProvider, Helmet } from 'react-helmet-async'

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
