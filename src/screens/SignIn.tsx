import React, { useEffect } from 'react'
import styled from 'styled-components'
import { Screen } from 'components/structure'
import { main } from 'workers'
import { useHistory } from 'utils/hooks'

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

  const { access_token: accessToken } = Object.fromEntries(
    location.hash
      .slice(1)
      .split('&')
      .map(v => v.split('='))
  )

  useEffect(() => {
    if (!accessToken) return
    main.signIn({ accessToken })
    history.replace(location.pathname)
  }, [accessToken, history])

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
