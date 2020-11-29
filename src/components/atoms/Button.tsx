import React from 'react'
import styled from 'styled-components'

type Props = {
  onClick?(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void
  iconWrap?: string
  text?: boolean
}

export const Button: React.FC<Props> = ({
  iconWrap,
  text,
  onClick,
  children,
}) => {
  const styles: string[] = []
  if (iconWrap) styles.push('icon-wrap')
  if (text) styles.push('text')
  return (
    <S.Button
      {...(styles.length && { ['data-style']: styles.join(' ') })}
      onClick={e => onClick?.(e)}
    >
      {children}
      {iconWrap && <S.Label>{iconWrap}</S.Label>}
    </S.Button>
  )
}

const S = {
  Button: styled.button`
    appearance: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.9rem;
    height: 2rem;
    padding: 0 1rem;
    background-color: var(--cl-background);
    color: var(--cl-primary);
    border: 2px solid var(--cl-primary);
    border-radius: 1rem;
    -webkit-tap-highlight-color: transparent;

    &[data-style~='icon-wrap'] {
      background-color: transparent;
      padding: 0;
      border: none;
      border-radius: unset;
    }

    &[data-style~='text'] {
      padding: 0;
      background-color: transparent;
      color: var(--cl-primary);
      font-size: 0.75rem;
      font-weight: 400;
      border-radius: unset;
      border: none;
      text-transform: uppercase;
      letter-spacing: 0.1rem;
    }

    &:focus {
      outline: none;
    }
  `,

  Label: styled.span`
    clip: rect(0 0 0 0);
    clip-path: inset(100%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  `,
}
