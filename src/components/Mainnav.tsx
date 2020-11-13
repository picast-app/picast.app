import React from 'react'
import styled from 'styled-components'
import { Icon } from 'components/atoms'
import { Link } from 'react-router-dom'
import { Bar } from './styledComponents'

export default function Mainnav() {
  return (
    <S.Navbar as="nav">
      <ul>
        <Item path="/" icon="library" />
        <Item path="/feed" icon="subscriptions" />
        <Item path="/profile" icon="person" />
      </ul>
    </S.Navbar>
  )
}

type ItemProps = Props<typeof Icon> & {
  path: string
}

const Item = ({ path, ...props }: ItemProps) => (
  <S.Item>
    <Link to={path}>
      <Icon {...props} />
    </Link>
  </S.Item>
)

const S = {
  Navbar: styled(Bar)`
    bottom: 0;

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      height: 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
    }
  `,

  Item: styled.li`
    flex-grow: 1;
    height: 100%;

    a {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-around;
    }
  `,
}
