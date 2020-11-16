import React from 'react'
import styled, { AnyStyledComponent } from 'styled-components'
import Appbar from 'components/Appbar'

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
    padding: ${({ padd }) => (padd ? '2rem' : '0px')};
    padding-top: calc(${({ padd }) => (padd ? '2rem' : '0px')} + ${p => p.offsetTop});
    height: calc(100vh - var(--bar-height));
    overflow-y: auto;

    &::-webkit-scrollbar {
      display: none;
    }
  `,
}
