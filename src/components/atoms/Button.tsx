import React from 'react'
import styled from 'styled-components'

type Props = {
  iconWrap?: string
  onClick?(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void
}

export const Button: React.FC<Props> = ({ iconWrap, onClick, children }) => {
  const styles: string[] = []
  if (iconWrap) styles.push('icon-wrap')
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
    border: none;
    cursor: pointer;

    &[data-style~='icon-wrap'] {
      background-color: transparent;
      padding: 0;

      &:focus {
        outline: none;
      }
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
