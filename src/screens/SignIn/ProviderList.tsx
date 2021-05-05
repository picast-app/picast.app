import React, { useState } from 'react'
import styled from 'styled-components'
import { Icon, Input } from 'components/atoms'
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
      </fieldset>
    </S.List>
  )
}

function IdentInput() {
  const [ident, setIdent] = useState('')
  const [password, setPassword] = useState('')

  return (
    <>
      <Input
        placeholder="Email or User Name"
        value={ident}
        onChange={setIdent}
        required
        pattern="[a-zZ-Z0-9]{3,30}"
      />
      <Input
        placeholder="Password"
        value={password}
        onChange={setPassword}
        type="password"
        required
        minLength={8}
      />
      <button type="submit">continue</button>
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

    input + input {
      margin-top: 0.5rem;
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
      /* opacity: 0.8; */
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
