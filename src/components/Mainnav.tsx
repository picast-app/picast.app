import React from 'react'
import styled from 'styled-components'
import { Icon } from 'components/atoms'
import { Link } from 'react-router-dom'
import { Surface } from 'components/structure'
import { bar } from 'styles/mixin'

export default function Mainnav() {
  return (
    <Surface sc={S.Navbar} el={4}>
      <ul>
        <Item path="/" icon="library" />
        <Item path="/feed" icon="subscriptions" />
        <Item path="/discover" icon="search" />
        <Item path="/profile" icon="person" />
      </ul>
    </Surface>
  )
}

type ItemProps = ReactProps<typeof Icon> & {
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
  Navbar: styled.nav`
    ${bar}
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
