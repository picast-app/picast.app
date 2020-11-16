import React from 'react'
import styled from 'styled-components'
import { Icon, Link } from 'components/atoms'
import { Surface } from 'components/structure'
import { bar } from 'styles/mixin'
import { desktop } from 'styles/responsive'
import { useMatchMedia } from 'utils/hooks'

export default function Mainnav() {
  const isDesktop = useMatchMedia(desktop)

  return (
    <Surface sc={S.Navbar} el={isDesktop ? 0 : 4}>
      <ul>
        <Item path="/" label="Library" icon="library" />
        <Item path="/feed" label="Feed" icon="subscriptions" />
        <Item path="/discover" label="Discover" icon="search" />
        <Item path="/profile" label="Profile" icon="person" />
      </ul>
    </Surface>
  )
}

type ItemProps = ReactProps<typeof Icon> & {
  path: string
  label: string
}

const Item = ({ path, label, ...props }: ItemProps) => (
  <S.Item>
    <Link to={path}>
      <Icon {...props} />
      <span>{label}</span>
    </Link>
  </S.Item>
)

const S = {
  Navbar: styled.nav`
    ${bar}
    bottom: 0;
    z-index: 1000;

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      height: 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    @media ${desktop} {
      width: var(--sidebar-width);
      height: 100vh;
      position: static;
      flex-shrink: 0;
      background-color: var(--surface-alt);
      padding: 2rem;

      --cl-text: var(--cl-text-alt);

      border: none;

      ul {
        flex-direction: column;
        height: unset;
        width: unset;
        align-items: flex-start;
      }
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
      text-decoration: none;
    }

    span {
      margin-left: 1rem;
      display: none;
    }

    @media ${desktop} {
      margin-bottom: 1rem;

      span {
        display: initial;
      }
    }
  `,
}
