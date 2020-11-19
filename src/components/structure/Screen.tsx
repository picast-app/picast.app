import React from 'react'
import styled, { AnyStyledComponent } from 'styled-components'
import Appbar from 'components/Appbar'
import { desktop } from 'styles/responsive'

type Props = {
  style?: AnyStyledComponent
  padd?: boolean
}

export const Screen: React.FC<Props> = ({ style, padd, ...props }) => {
  const children = React.Children.toArray(props.children)
  const appbar =
    typeof children[0] === 'object' &&
    ((children[0] as unknown) as React.ReactElement).type === Appbar
      ? children.splice(0, 1)[0]
      : React.Fragment

  return (
    <S.Screen
      offsetTop={appbar !== React.Fragment ? 'var(--bar-height)' : '0px'}
      as={style}
      padd={padd}
    >
      {appbar}
      {children}
    </S.Screen>
  )
}

// prettier-ignore
const S = {
  Screen: styled.div<{ offsetTop: string; padd?: boolean }>`
    --top-off: ${({offsetTop}) => offsetTop};
  
    padding: ${({ padd }) => (padd ? '2rem' : '0px')};
    padding-top: calc(${({ padd }) => (padd ? '2rem' : '0px')} + var(--top-off));
    height: calc(100% - var(--bar-height));
    overflow-y: auto;
    position: relative;

    &::-webkit-scrollbar {
      display: none;
    }

    @media ${desktop} {
      height: 100%;
      flex-grow: 1;
      --top-off: 0px;
    }
  `,
}
