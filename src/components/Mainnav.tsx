import React from 'react'
import styled from 'styled-components'
import { Icon, Link } from 'components/atoms'
import { Surface } from 'components/structure'
import { PlayerSC } from 'components/composite'
import { bar } from 'styles/mixin'
import { desktop, mobile } from 'styles/responsive'
import { useMatchMedia, useTheme, useNavbarWidget } from 'utils/hooks'
import Search from './PodcastSearch'

export default function Mainnav() {
  const isDesktop = useMatchMedia(desktop)
  const theme = useTheme()
  const widgets = useNavbarWidget()

  return (
    <Surface
      sc={S.Navbar}
      el={isDesktop && theme === 'light' ? 0 : 4}
      alt={isDesktop && theme === 'light'}
    >
      <S.SearchWrap>
        <Search visual />
      </S.SearchWrap>
      <ul>
        <Item path="/" label="Library" icon="library" />
        <Item path="/feed" label="Feed" icon="subscriptions" />
        <Item path="/discover" label="Discover" icon="search" />
        <Item path="/profile" label="Profile" icon="person" />
      </ul>
      {isDesktop && <S.WidgetTray>{widgets}</S.WidgetTray>}
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
    display: flex;
    flex-direction: column;

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
      padding: 2rem;

      ul {
        flex-direction: column;
        height: unset;
        width: unset;
        align-items: flex-start;
      }

      ${PlayerSC} ~ & {
        padding-bottom: var(--player-height);
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

  WidgetTray: styled.div`
    display: flex;
    flex-direction: column;
    margin-top: auto;

    & > * {
      margin-top: 1rem;
    }
  `,

  SearchWrap: styled.div`
    margin-bottom: 2rem;

    @media ${mobile} {
      display: none;
    }
  `,
}
