import React from 'react'
import styled from 'styled-components'
import Routes from 'Routes'
import Mainnav from 'components/Mainnav'
import { Theme } from 'styles'
import { desktop } from 'styles/responsive'
import { useMatchMedia } from 'utils/hooks'

export default function App() {
  const isDarkMode = useMatchMedia('(prefers-color-scheme: dark)')

  return (
    <Theme.Provider value={isDarkMode ? 'dark' : 'light'}>
      <S.App>
        <Routes />
        <Mainnav />
      </S.App>
    </Theme.Provider>
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
