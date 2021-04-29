import React, { useEffect } from 'react'
import styled from 'styled-components'
import { Redirect } from '@picast-app/router'
import { Screen } from 'components/structure'
import { main } from 'workers'
import { useAppState } from 'utils/hooks'
import * as wp from 'utils/webpush'
import { history, RouteProps } from '@picast-app/router'

const url = new URL(process.env.GOOGLE_OAUTH_ENDPOINT as string)

const scopes = ['openid']

url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID as string)
url.searchParams.set(
  'redirect_uri',
  (location.origin + location.pathname).replace(/\/$/, '')
)
url.searchParams.set('response_type', 'token')
url.searchParams.set('scope', scopes.join(' '))

const SignIn: React.FC<RouteProps> = ({ location }) => {
  const [signedIn, loading] = useAppState<boolean>('signedIn')

  const { access_token: accessToken } = Object.fromEntries(
    location.hash
      .slice(1)
      .split('&')
      .map(v => v.split('='))
  )

  async function signIn() {
    main.signIn({ accessToken }, await wp.getSubscription(true))
    history.push(location.path, { replace: true })
  }

  useEffect(() => {
    if (!accessToken) return
    signIn()
    // eslint-disable-next-line
  }, [accessToken, history])

  if (!loading && signedIn) return <Redirect to="/" />
  return (
    <Screen padd loading={!!location.hash}>
      <span>Sign In</span>
      <S.Provider href={url.href}>SignIn with Google</S.Provider>
    </Screen>
  )
}
export default SignIn

const S = {
  Provider: styled.a`
    display: block;
    margin-top: 1rem;
  `,
}
