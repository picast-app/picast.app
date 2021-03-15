import React from 'react'
import styled from 'styled-components'

type Props = {
  onClick?(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void
  iconWrap?: string
  text?: boolean
  autoFocus?: boolean
  tabIndex?: number
}

export const Button: React.FC<Props> = ({
  iconWrap,
  text,
  onClick,
  children,
  ...props
}) => {
  const styles: string[] = []
  if (iconWrap) styles.push('icon-wrap')
  if (text) styles.push('text')
  return (
    <S.Button
      {...props}
      {...(styles.length && { ['data-style']: styles.join(' ') })}
      onClick={e => onClick?.(e)}
      {...(iconWrap && { title: iconWrap })}
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
      display: block;
      width: var(--icon-size);
      height: var(--icon-size);
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
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  `,
}
