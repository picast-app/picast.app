import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Icon, Input } from 'components/atoms'
import { Screen, Dialog } from 'components/structure'
import Appbar from 'components/Appbar'
import { main } from 'workers'
import { useAppState } from 'utils/hooks'
import * as wp from 'utils/webpush'
import { Redirect, useLocation, history, RouteProps } from '@picast-app/router'
import { mobile } from 'styles/responsive'

const Signin: React.FC<RouteProps> = ({ location }) => {
  const [signedIn, signingIn] = useOAuthSignIn()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const signup = location.path.includes('signup')
  const title = $(`@signin.title${signup ? '_signup' : ''}` as const)

  async function signIn() {
    const response = await main.signInPassword(name, password)
    if (response.reason === 'unknown_ident') history.push('/signup')
  }

  if (signedIn) return <Redirect to="/" />
  return (
    <Screen padd loading={signingIn}>
      <Appbar title={title} />
      <MainScreen
        {...{
          name,
          setName,
          password,
          setPassword,
          passConfirm,
          setPassConfirm,
          title,
          signup,
        }}
        onSubmit={signIn}
      />
      {signingIn && <S.Overlay />}
    </Screen>
  )
}
export default Signin

type MainProps = {
  name: string
  setName(v: string): void
  password: string
  setPassword(v: string): void
  passConfirm: string
  setPassConfirm(v: string): void
  onSubmit(): void
  signup: boolean
  title: string
}

function MainScreen({ onSubmit, signup, ...props }: MainProps) {
  const ref = useRef<HTMLFieldSetElement>(null)

  useEffect(() => {
    if (signup)
      [...(ref.current?.querySelectorAll('input') ?? [])].slice(-1)[0]?.focus()
  }, [signup])

  return (
    <S.List
      onSubmit={e => {
        e.preventDefault()
        onSubmit()
      }}
      data-stage={signup ? 'signup' : 'signin'}
    >
      <fieldset ref={ref}>
        <legend>{props.title}</legend>
        <S.OAuthWrap>
          <S.Google href={googleURL()}>
            <Icon icon="google" />
            {$`@signin.google`}
          </S.Google>
          <hr />
        </S.OAuthWrap>
        <PasswordSignin {...{ ...props, signup }} />
      </fieldset>
    </S.List>
  )
}

function PasswordSignin({
  name,
  setName,
  password,
  setPassword,
  passConfirm,
  setPassConfirm,
  signup,
}: Omit<MainProps, 'onSubmit'>) {
  const [showInfo, setShowInfo] = useState(false)
  const [revealed, setReveal] = useState(false)

  const reveal = (
    <Icon
      icon={revealed ? 'not_visible' : 'visible'}
      label={revealed ? $`hide` : $`show`}
      onClick={() => setReveal(!revealed)}
    />
  )

  return (
    <>
      <Input
        placeholder={$.or($.c`email`, $.c`username`)}
        value={name}
        onChange={setName}
        required
        minLength={3}
        pattern=".*[^\s]{3,}.*"
        actions={[
          <Icon
            icon="info"
            onClick={() => setShowInfo(true)}
            label={$`explain`}
          />,
        ]}
      />
      <Input
        placeholder={$.c`password`}
        value={password}
        onChange={setPassword}
        type={revealed ? 'text' : 'password'}
        required
        minLength={8}
        actions={[reveal]}
      />
      <Input
        placeholder={'confirm password'}
        value={passConfirm}
        onChange={(v, input) => {
          setPassConfirm(v)
          input.setCustomValidity(v === password ? '' : 'passwords must match')
        }}
        type={revealed ? 'text' : 'password'}
        required={signup}
        minLength={8}
        actions={[reveal]}
        hidden={!signup}
        disabled={!signup}
      />
      <Dialog open={showInfo} onClose={() => setShowInfo(false)}>
        <p>{$`@signin.info_1`}</p>
        <p>{$`@signin.info_2`}</p>
        <p>{$`@signin.info_3`}</p>
      </Dialog>
      <button type="submit">{signup ? $`@signin.signup` : $`continue`}</button>
    </>
  )
}

function useOAuthSignIn() {
  const [inProgress, setInProgress] = useState(false)
  const { path, hash } = useLocation()
  const [stateSignedIn] = useAppState<boolean>('user.signedIn')
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

    --td: 0.3s;

    fieldset,
    legend {
      transition: transform var(--td) ease;
    }

    &[data-stage='signup'] fieldset {
      transform: translateY(-7rem);

      legend {
        transform: translateY(7rem);
      }
    }

    fieldset > div:last-of-type,
    button[type='submit'] {
      transition: transform var(--td) ease;
    }

    &[data-stage='signin'] fieldset {
      & > div:last-of-type,
      button[type='submit'] {
        z-index: -1;
        transform: translateY(-3.5rem);
      }
    }

    button,
    input,
    a {
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

    fieldset > * {
      margin-top: 0.5rem;
    }

    fieldset > div > hr + * {
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

  OAuthWrap: styled.div`
    --tdh: calc(var(--td) / 2);
    transition: opacity var(--tdh) var(--tdh);

    [data-stage='signup'] & {
      opacity: 0;
      transition: opacity var(--tdh);
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
