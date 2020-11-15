import React from 'react'
import styled from 'styled-components'
import Appbar from './Appbar'

const Screen: React.FC = props => {
  const children = React.Children.toArray(props.children)
  const appbar =
    typeof children[0] === 'object' &&
    ((children[0] as unknown) as React.ReactElement).type === Appbar
      ? children.splice(0, 1)[0]
      : React.Fragment

  return (
    <S.Screen>
      {appbar}
      {children}
    </S.Screen>
  )
}

const S = {
  Screen: styled.div`
    padding-top: 3.5rem;
    max-height: calc(100vh - 3.5rem);
    overflow-y: auto;

    &::-webkit-scrollbar {
      display: none;
    }
  `,
}

export default Screen
