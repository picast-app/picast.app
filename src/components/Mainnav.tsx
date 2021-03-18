import React from 'react'
import styled from 'styled-components'
import { Icon, Link } from 'components/atoms'
import { Surface } from 'components/structure'
import { bar } from 'styles/mixin'
import { desktop, mobile } from 'styles/responsive'
import {
  useMatchMedia,
  useTheme,
  useNavbarWidget,
  useLocation,
} from 'utils/hooks'
import Search from './PodcastSearch'

const routes: {
  path: string
  label: string
  icon: ReactProps<typeof Icon>['icon']
  match?: RegExp
  desktop?: true
}[] = [
  { path: '/', label: 'Library', icon: 'library', match: /^\/show/i },
  { path: '/feed', label: 'Feed', icon: 'subscriptions' },
  { path: '/discover', label: 'Discover', icon: 'search', match: /^\/search/i },
  {
    path: '/profile',
    label: 'Profile',
    icon: 'person',
    match: /^\/(signin|settings)/i,
  },
  { path: '/settings', label: 'Settings', icon: 'gear', desktop: true },
]

export default function Mainnav() {
  const isDesktop = useMatchMedia(desktop)
  const theme = useTheme()
  const widgets = useNavbarWidget()
  useLocation()

  return (
    <Surface
      sc={S.Navbar}
      el={isDesktop && theme === 'light' ? 0 : 4}
      alt={isDesktop && theme === 'light'}
      id="mainnav"
    >
      <S.SearchWrap>
        <Search visual />
      </S.SearchWrap>
      <ul>
        {routes
          .map(
            ({ path, label, icon, desktop, match }) =>
              (!desktop || isDesktop) && (
                <Item
                  key={path}
                  {...{ path, label, icon }}
                  active={
                    (match && matchLocaction(match)) || matchLocaction(path)
                  }
                />
              )
          )
          .filter(Boolean)}
      </ul>
      {isDesktop && <S.WidgetTray>{widgets}</S.WidgetTray>}
    </Surface>
  )
}

const matchLocaction = (match: RegExp | string) =>
  typeof match === 'string'
    ? match.toLowerCase() === location.pathname
    : match.test(location.pathname)

type ItemProps = ReactProps<typeof Icon> & {
  path: string
  label: string
  active?: boolean
}

const Item = ({ path, label, icon, active }: ItemProps) => (
  <S.Item
    data-label={label.toLowerCase()}
    {...(active && { ['aria-current']: 'page' })}
  >
    <Link to={path}>
      <Icon icon={icon} />
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
    will-change: transform;

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

      picast-player:not([hidden]) ~ & {
        padding-bottom: var(--player-height);
      }
    }

    @media ${mobile} {
      z-index: 9001;

      picast-player:not([hidden]) ~ & {
        box-shadow: unset;
      }

      svg {
        transform: scale(1.1);
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

    @media ${mobile} {
      &[aria-current] svg {
        fill: var(--cl-primary);
      }
    }

    &[data-label='settings'] {
      margin-top: 2rem;
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
