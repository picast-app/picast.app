import React from 'react'
import styled from 'styled-components'
import Appbar from 'components/Appbar'

export const Screen: React.FC = props => {
  const children = React.Children.toArray(props.children)
  const appbar =
    typeof children[0] === 'object' &&
    ((children[0] as unknown) as React.ReactElement).type === Appbar
      ? children.splice(0, 1)[0]
      : React.Fragment

  return (
    <S.Screen offsetTop={appbar !== React.Fragment ? '3.5rem' : 0}>
      {appbar}
      {children}
    </S.Screen>
  )
}

const S = {
  Screen: styled.div<{ offsetTop: string | 0 }>`
    padding-top: ${p => p.offsetTop};
    max-height: calc(100vh - ${p => p.offsetTop});
    overflow-y: auto;

    &::-webkit-scrollbar {
      display: none;
    }
  `,
}
