import React from 'react'
import styled from 'styled-components'
import { Link } from 'components/atoms'
import { Screen } from 'components/structure'
import { center } from 'styles/mixin'
import { useAppState } from 'utils/hooks'

export default function Wrap() {
  return (
    <Screen>
      <Main />
    </Screen>
  )
}

function Main() {
  const [signedIn, loading] = useAppState<boolean>('signedIn')
  if (loading) return null
  if (!signedIn) return <Intro />
  return <Feed />
}

function Feed() {
  return null
}

function Intro() {
  return (
    <S.Intro>
      <span>
        When you are <Link to="/signin">signed in</Link>, new episodes from the
        podcasts you subscribe to will appear here.
      </span>
    </S.Intro>
  )
}

const S = {
  Intro: styled.div`
    ${center}
    width: 100%;
    padding: 1rem;
    text-align: center;

    span {
      font-size: 1.2rem;
      opacity: 0.8;
      line-height: 1.3;
    }
  `,
}
