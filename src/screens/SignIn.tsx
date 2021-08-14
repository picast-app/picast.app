import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Icon, Input } from 'components/atoms'
import { Screen, Dialog } from 'components/structure'
import Appbar from 'components/Appbar'
import { main } from 'workers'
import { useStateX } from 'hooks/store'
import * as wp from 'utils/webpush'
import { mobile } from 'styles/responsive'
import {
  Redirect,
  useLocation,
  history,
  RouteProps,
  Link,
} from '@picast-app/router'

const Signin: React.FC<RouteProps> = ({ location }) => {
  const [user] = useStateX('user')
  const loading = useOAuthSignIn(user === undefined ? undefined : !!user)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [inUse, setInUse] = useState(false)
  const isSignUp = location.path.includes('signup')
  const title = $(`@signin.title${isSignUp ? '_signup' : ''}` as const)

  async function signIn() {
    const response = await main.signInPassword(name, password)
    if (response.reason === 'unknown_ident') history.push('/signup')
    if (response.reason === 'incorrect_auth') {
      const input = document.getElementById('in-p') as HTMLInputElement
      input.setCustomValidity($`@signin.wrong_pass`)
      input.classList.add('incorrect')
    }
  }

  async function signUp() {
    if (password !== passConfirm || !isSignUp) return
    const response = await main.signUpPassword(name, password)
    if (response.reason === 'duplicate_ident') setInUse(true)
  }

  if (user) return <Redirect to="/" />
  return (
    <Screen padd loading={loading}>
      <Appbar title={title} {...(isSignUp && { back: '/signin' })} />
      <MainScreen
        {...{
          name,
          setName,
          password,
          setPassword,
          passConfirm,
          setPassConfirm,
          title,
          inUse,
          setInUse,
        }}
        setName={v => {
          if (inUse) setInUse(false)
          setName(v)
        }}
        signup={isSignUp}
        onSubmit={isSignUp ? signUp : signIn}
      />
      {loading && <S.Overlay />}
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
  inUse: boolean
  setInUse(v: boolean): void
}

const MainScreen: React.FunctionComponent<MainProps> = ({
  onSubmit,
  signup,
  setPassConfirm,
  ...props
}) => {
  useEffect(() => {
    if (signup) document.getElementById('in-pr')?.focus()
    else setPassConfirm('')
  }, [signup, setPassConfirm])

  return (
    <S.List
      onSubmit={e => {
        e.preventDefault()
        onSubmit()
      }}
      data-stage={signup ? 'signup' : 'signin'}
    >
      <fieldset>
        <legend>{props.title}</legend>
        <S.OAuthWrap>
          <S.Google href={googleURL()}>
            <Icon icon="google" />
            {$`@signin.google`}
          </S.Google>
          <hr />
        </S.OAuthWrap>
        <PasswordSignin {...{ ...props, signup, setPassConfirm }} />
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
  inUse,
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
        autoComplete="username"
        actions={[
          <Icon
            icon="info"
            onClick={() => setShowInfo(true)}
            label={$`explain`}
          />,
        ]}
        id="in-use"
      />
      {inUse && (
        <S.Error>
          {$`@signin.in_use_a`}
          <Link to="/signin">{$`@signin.in_use_link`}</Link>
          {$`@signin.in_use_b`}
        </S.Error>
      )}
      <Input
        placeholder={$.c`password`}
        value={password}
        onChange={(v, input) => {
          setPassword(v)
          input.setCustomValidity('')
          input.classList.remove('incorrect')
        }}
        type={revealed ? 'text' : 'password'}
        required
        minLength={8}
        {...(signup && { autoComplete: 'new-password' })}
        actions={[reveal]}
        id="in-p"
      />
      <Input
        placeholder={'confirm password'}
        value={passConfirm}
        onChange={(v, input) => {
          setPassConfirm(v)
          input.setCustomValidity(v === password ? '' : $`@signin.must_match`)
        }}
        type={revealed ? 'text' : 'password'}
        required={signup}
        minLength={8}
        {...(signup && { autoComplete: 'new-password' })}
        actions={[reveal]}
        hidden={!signup}
        disabled={!signup}
        id="in-pr"
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

function useOAuthSignIn(signedIn?: boolean) {
  const [inProgress, setInProgress] = useState(false)
  const { path, hash } = useLocation()
  const accessToken = hash.match(/access_token=([^&]+)/)?.[1]
  if (accessToken) history.push(path, { replace: true })

  useEffect(() => {
    if (!accessToken || inProgress) return

    setInProgress(true)
    signIn()

    async function signIn() {
      if (!accessToken) throw Error()
      await main.signIn({ accessToken }, await wp.getSubscription(true))
      setInProgress(false)
    }
  }, [accessToken, inProgress, signedIn])

  return inProgress
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
    div > a {
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

    input:not(.incorrect):focus-visible,
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

  Error: styled.span`
    color: var(--cl-error);
    font-size: 0.8rem;
    margin-bottom: 1rem;

    a {
      color: inherit;
      text-decoration: underline;
    }
  `,
}
