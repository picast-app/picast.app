import React from 'react'
import styled from 'styled-components'

type Props = {
  id?: string
  checked?: boolean
  onChange?: (v: boolean) => void
}

export function Switch({ onChange, ...props }: Props) {
  return (
    <S.Switch
      type="checkbox"
      {...props}
      onChange={({ target }) => onChange?.(target.checked)}
    ></S.Switch>
  )
}

const S = {
  Switch: styled.input`
    appearance: none;
    position: relative;
    margin: 0;
    padding: 0;
    overflow: hidden;
    display: block;
    flex-grow: 0;
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;

    --tray-height: 1.5rem;
    --tray-border-width: 2px;
    --width: 3rem;

    height: var(--tray-height);
    width: var(--width);
    border-radius: calc(var(--tray-height) / 2);
    background-color: var(--cl-background);
    --color: #888;
    border: var(--tray-border-width) solid var(--color);
    cursor: pointer;

    &::before,
    &::after {
      content: '';
      position: absolute;
      /* prettier-ignore */
      transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
    }

    &::after {
      --size: calc(var(--tray-border-width) * -1);
      top: var(--size);
      left: var(--size);
      width: var(--tray-height);
      height: var(--tray-height);
      margin: 0;
      border: var(--tray-border-width) solid var(--color);
      border-radius: 50%;
      background-color: inherit;
    }

    &::before {
      top: 0;
      left: calc(var(--tray-height) / 2);
      width: 100%;
      height: 100%;
      background-color: var(--cl-border-light);
    }

    &:focus {
      outline: none;
    }

    &:checked::after,
    &:checked::before {
      transform: translateX(calc(var(--width) - var(--tray-height)));
    }

    html[data-theme='dark'] & {
      background-color: #eee;
      border: none;

      &::before {
        background-color: #555;
      }

      &::after {
        top: 0;
        left: 0;
        border-color: var(--cl-text);
        background: var(--cl-background);
      }

      &:not(:checked)::after {
        border-color: #555;
        background-color: #eee;
      }
    }
  `,
}
