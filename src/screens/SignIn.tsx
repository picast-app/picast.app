import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Icon, Input } from 'components/atoms'
import { Screen, Dialog } from 'components/structure'
import Appbar from 'components/Appbar'
import { main } from 'workers'
import { useAppState } from 'utils/hooks'
import * as wp from 'utils/webpush'
import { Redirect, useLocation, history } from '@picast-app/router'
import { mobile } from 'styles/responsive'

export default function SiginIn() {
  const [signedIn, signingIn] = useOAuthSignIn()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  if (signedIn) return <Redirect to="/" />
  return (
    <Screen padd loading={signingIn}>
      <Appbar title="Sign In / Sign Up" />
      <MainScreen {...{ name, setName, password, setPassword }} />
      {signingIn && <S.Overlay />}
    </Screen>
  )
}

type MainProps = {
  name: string
  setName(v: string): void
  password: string
  setPassword(v: string): void
}

function MainScreen({ name, setName, password, setPassword }: MainProps) {
  const [showInfo, setShowInfo] = useState(false)
  const [revealed, setReveal] = useState(false)

  return (
    <S.List onSubmit={e => e.preventDefault()}>
      <fieldset>
        <legend>Sign In / Sign Up</legend>
        <S.Google href={googleURL()}>
          <Icon icon="google" />
          with Google
        </S.Google>
        <hr />
        <Input
          placeholder="Email or User Name"
          value={name}
          onChange={setName}
          required
          pattern="[a-zZ-Z0-9]{3,30}"
          actions={[
            <Icon
              icon="info"
              onClick={() => setShowInfo(true)}
              label="explain"
            />,
          ]}
        />
        <Input
          placeholder="Password"
          value={password}
          onChange={setPassword}
          type={revealed ? 'text' : 'password'}
          required
          minLength={8}
          actions={[
            <Icon
              icon={revealed ? 'not_visible' : 'visible'}
              label={revealed ? 'hide' : 'show'}
              onClick={() => setReveal(!revealed)}
            />,
          ]}
        />
        <Dialog open={showInfo} onClose={() => setShowInfo(false)}>
          <p>
            You don't need to to tell us your email address to use Picast. Any
            user name you can remember will allow you to sign in.
          </p>
          <p>
            Just keep in mind that if you choose to not use an email address, we
            won't be able to send you a reset link should you forget your
            password.
          </p>
          <p>
            If you change your mind you can always connect or remove your email
            addressfrom your profile settings.
          </p>
        </Dialog>
        <button type="submit">continue</button>
      </fieldset>
    </S.List>
  )
}

function useOAuthSignIn() {
  const [inProgress, setInProgress] = useState(false)
  const { path, hash } = useLocation()
  const [stateSignedIn] = useAppState<boolean>('signedIn')
  const [signedIn, setSignedIn] = useState(stateSignedIn ?? false)
  useEffect(() => {
    if (typeof stateSignedIn === 'boolean') setSignedIn(stateSignedIn)
  }, [stateSignedIn])

  const accessToken = hash.match(/access_token=([^&]+)/)?.[1]
  if (accessToken) history.push(path, { replace: true })

  useEffect(() => {
    if (!accessToken || inProgress || signedIn) return

    setInProgress(true)
    signIn()

    async function signIn() {
      if (!accessToken) throw Error()
      await main.signIn({ accessToken }, await wp.getSubscription(true))
      setInProgress(false)
      setSignedIn(true)
    }
  }, [accessToken, inProgress, signedIn])

  return [signedIn, inProgress]
}

function googleURL() {
  const scopes = ['openid']

  const url = new URL(process.env.GOOGLE_OAUTH_ENDPOINT as string)
  url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID as string)
  url.searchParams.set(
    'redirect_uri',
    (location.origin + location.pathname).replace(/\/$/, '')
  )
  url.searchParams.set('response_type', 'token')
  url.searchParams.set('scope', scopes.join(' '))

  return url.href
}

const S = {
  Overlay: styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(2px) saturate(50%);
  `,

  List: styled.form`
    max-width: 50ch;
    --bcl: var(--cl-border-strong);

    legend {
      margin-bottom: 2rem;
      font-size: 1.41rem;
      font-weight: 400;

      @media ${mobile} {
        position: absolute;
        left: -10000px;
      }
    }

    hr {
      height: 2px;
      overflow: visible;
      border: none;
      background-color: var(--bcl);
      margin: 2rem 0;
      position: relative;
      font-size: 0.8rem;
    }

    hr::after {
      content: 'or';
      color: var(--bcl);
      background-color: var(--cl-background);
      position: absolute;
      left: 50%;
      padding: 0 0.5rem;
      text-align: center;
      transform: translate(-50%, -50%);
    }

    fieldset > button,
    input,
    fieldset > a {
      appearance: none;
      width: 100%;
      height: 3rem;
      border: 2px solid var(--bcl);
      background-color: transparent;
      text-align: start;
      border-radius: 0.25rem;
      font-family: inherit;
      font-size: 0.9rem;
    }

    fieldset > *:not(hr) {
      margin-top: 0.5rem;
    }

    fieldset > hr + * {
      margin-top: unset;
    }

    button[type='submit'] {
      margin-top: 1.5rem;
      text-align: center;
      border: none;
      background-color: var(--cl-surface-alt);
      color: var(--cl-text-alt);
      letter-spacing: 0.1rem;
      font-size: 0.85rem;
      cursor: pointer;
    }

    &:invalid button[type='submit'] {
      color: var(--cl-text-alt-disabled);
    }

    input:focus-visible,
    a:focus-visible {
      border-color: var(--cl-primary);
      box-shadow: inset 0 0 2px var(--cl-primary);
      outline: none;
    }

    input:focus-visible::placeholder {
      color: var(--cl-primary);
    }
  `,

  Google: styled.a`
    display: flex;
    align-items: center;
    color: var(--cl-text);
    font-weight: 400;

    svg {
      height: 1.4rem;
      margin-right: 1rem;
      margin-left: 0.5rem;
    }
  `,
}
