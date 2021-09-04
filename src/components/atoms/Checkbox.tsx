import React from 'react'
import styled from 'styled-components'
import { Spinner } from './Spinner'

type Props = {
  checked?: boolean
  onChange?: (v: boolean) => void
  id?: string
  disabled?: boolean
  loading?: boolean
}

export const Checkbox: React.FC<Props> = ({
  checked,
  onChange,
  disabled,
  loading,
  ...props
}) => {
  return !loading ? (
    <SC
      {...props}
      type="checkbox"
      checked={checked}
      onChange={({ currentTarget }) => onChange?.(currentTarget.checked)}
      disabled={disabled}
    />
  ) : (
    <SpinWrap>
      <Spinner />
    </SpinWrap>
  )
}

const backSvg = (cl: string) =>
  `url('data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="${cl}"/></svg>`
  )}')`

const size = '1rem'

const SC = styled.input`
  display: block;
  cursor: pointer;
  appearance: none;
  margin: 0;
  position: relative;

  --size: ${size};
  --trans: 0.1s ease-out;

  width: var(--size);
  height: var(--size);
  border: calc(0.125 * var(--size)) solid var(--cl-text);
  border-radius: calc(0.125 * var(--size));
  transition: background-color var(--trans), border-color var(--trans);
  background-size: 120%;
  background-position: center;
  box-sizing: content-box;

  &:disabled {
    cursor: default;
    opacity: 0.3;
  }

  &:checked {
    background-color: var(--cl-primary);
    border-color: #0000;
    background-image: ${backSvg('#fff')};
  }

  &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    right: 0;
    top: 0;
    background-color: var(--cl-background);
    transition: background-color var(--trans), transform 0.2s ease;
    transform-origin: right;
  }

  &:checked::after {
    transform: scaleX(0);
    background-color: var(--cl-primary);
  }

  @media (hover: hover) {
    &::before {
      content: '';
      position: absolute;
      left: -75%;
      top: -75%;
      width: 250%;
      height: 250%;
      background-color: var(--cl-text);
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }

    &:hover:not(:disabled)::before {
      opacity: 0.1;
    }

    &:checked::before {
      background-color: var(--cl-primary);
    }

    &:active::before {
      opacity: 0.02;
    }
  }
`

const SpinWrap = styled.div`
  --size: calc(1.25 * ${size});

  position: relative;
  width: var(--size);
  height: var(--size);
  overflow: hidden;

  svg {
    position: absolute;
    left: -50%;
    top: -50%;
    width: 200%;
    height: 200%;
  }
`
