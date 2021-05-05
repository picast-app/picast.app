export function googleURL() {
  const scopes = ['openid']

  const url = new URL(process.env.GOOGLE_OAUTH_ENDPOINT as string)
  url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID as string)
  url.searchParams.set(
    'redirect_uri',
    (location.origin + location.pathname).replace(/\/$/, '')
  )
  url.searchParams.set('response_type', 'token')
  url.searchParams.set('scope', scopes.join(' '))

  return url
}
