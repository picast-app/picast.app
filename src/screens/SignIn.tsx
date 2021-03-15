import React, { useEffect } from 'react'
import styled from 'styled-components'
import { Redirect } from 'react-router-dom'
import { Screen } from 'components/structure'
import { main } from 'workers'
import { useHistory, useAppState } from 'utils/hooks'
import * as wp from 'utils/webpush'

const url = new URL(process.env.GOOGLE_OAUTH_ENDPOINT as string)

const scopes = ['openid']

url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID as string)
url.searchParams.set(
  'redirect_uri',
  (location.origin + location.pathname).replace(/\/$/, '')
)
url.searchParams.set('response_type', 'token')
url.searchParams.set('scope', scopes.join(' '))

export default function SignIn() {
  const history = useHistory()
  const [signedIn, loading] = useAppState<boolean>('signedIn')

  const { access_token: accessToken } = Object.fromEntries(
    location.hash
      .slice(1)
      .split('&')
      .map(v => v.split('='))
  )

  async function signIn() {
    main.signIn({ accessToken }, await wp.getSubscription(true))
    history.replace(location.pathname)
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

const S = {
  Provider: styled.a`
    display: block;
    margin-top: 1rem;
  `,
}
