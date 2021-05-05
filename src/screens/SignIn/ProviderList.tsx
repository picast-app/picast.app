import React, { useState } from 'react'
import styled from 'styled-components'
import { Icon, Input } from 'components/atoms'
import { Dialog } from 'components/structure'
import * as oauth from './oauth'

const { href: googleUrl } = oauth.googleURL()

export default function ProviderList() {
  return (
    <S.List onSubmit={e => e.preventDefault()}>
      <fieldset>
        <legend>Sign In / Sign Up</legend>
        <S.Google href={googleUrl}>
          <Icon icon="google" />
          With Google
        </S.Google>
        <hr />
        <IdentInput />
        <button type="submit">continue</button>
      </fieldset>
    </S.List>
  )
}

function IdentInput() {
  const [ident, setIdent] = useState('')
  const [password, setPassword] = useState('')
  const [showInfo, setShowInfo] = useState(false)

  return (
    <>
      <Input
        placeholder="Email or User Name"
        value={ident}
        onChange={setIdent}
        required
        pattern="[a-zZ-Z0-9]{3,30}"
        actions={[
          <Icon
            icon="info"
            key="info"
            onClick={() => setShowInfo(true)}
            label="explain"
          />,
        ]}
      />
      <Input
        placeholder="Password"
        value={password}
        onChange={setPassword}
        type="password"
        required
        minLength={8}
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
    </>
  )
}

const S = {
  List: styled.form`
    max-width: 50ch;
    --bcl: var(--cl-border-strong);

    legend {
      margin-bottom: 2rem;
      font-size: 1.41rem;
      font-weight: 400;
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
    }

    &:invalid button[type='submit'] {
      color: var(--cl-text-alt-disabled);
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
