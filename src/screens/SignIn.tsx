import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Redirect } from '@picast-app/router'
import { Screen } from 'components/structure'
import { main } from 'workers'
import { useAppState } from 'utils/hooks'
import * as wp from 'utils/webpush'
import { history, RouteProps } from '@picast-app/router'
import Providers from './SignIn/ProviderList'

const SignIn: React.FC<RouteProps> = ({ location }) => {
  const [signedIn, loading] = useAppState<boolean>('signedIn')
  const [signingIn, setSigningIn] = useState(false)

  const { access_token: accessToken } = Object.fromEntries(
    location.hash
      .slice(1)
      .split('&')
      .map(v => v.split('='))
  )

  async function signIn() {
    main.signIn({ accessToken }, await wp.getSubscription(true))
    history.push(location.path, { replace: true })
    setSigningIn(true)
  }

  useEffect(() => {
    if (!accessToken) return
    signIn()
    // eslint-disable-next-line
  }, [accessToken, history])

  if (!loading && signedIn) return <Redirect to="/" />
  return (
    <Screen padd loading={signingIn}>
      <Providers />
      {signingIn && <Overlay />}
    </Screen>
  )
}
export default SignIn

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(2px) saturate(50%);
`
