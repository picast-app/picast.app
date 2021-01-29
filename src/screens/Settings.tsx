import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Switch, Redirect, Route, useHistory } from 'react-router-dom'
import { Screen } from 'components/structure'
import Appbar from 'components/Appbar'
import { Link as HLink, Icon } from 'components/atoms'
import { animateTo } from 'utils/animate'
import { desktop, mobile } from 'styles/responsive'
import { useMatchMedia } from 'utils/hooks'
import About from './settings/About'
import Appearance from './settings/Appearance'
import Debug from './settings/Debug'

type SettingsRoute = {
  name: string
  path?: string
  icon: ReactProps<typeof Icon>['icon']
  component?: any
}
const routes: SettingsRoute[] = [
  { name: 'General', icon: 'gear' },
  { name: 'Appearance', icon: 'palette', component: Appearance },
  { name: 'Notifications', icon: 'bell' },
  { name: 'Debug', icon: 'bug', component: Debug },
  { name: 'About', icon: 'info', component: About },
]

const switchComp = (
  <Switch>
    {routes.map(
      ({
        name,
        path = name.toLowerCase(),
        component = () => <div>{name}</div>,
      }) => (
        <Route
          key={path}
          exact
          path={`/settings/${path}`}
          component={component}
        />
      )
    )}
    <Redirect to="/settings" />
  </Switch>
)

const animation = { duration: 200, easing: 'ease' }

export default function Settings() {
  const ref = useRef<HTMLDivElement>(null)
  const history = useHistory()
  const [mounted, setMounted] = useState(
    location.pathname === '/settings' ? true : false
  )
  const isDesktop = useMatchMedia(desktop)

  const path = location.pathname.split('/').slice(2)[0]
  const route = routes.find(v => (v.path ?? v.name.toLowerCase()) === path)

  useEffect(() => {
    if (isDesktop) {
      if (!location.pathname.split('/').slice(2)[0])
        history.push('/settings/general')
      return
    }
    const isSub = ref.current!.scrollLeft > 0
    if (isSub && !!route) return
    const transform = `translateX(${route ? '-100vw' : 0})`
    if (!mounted) ref.current!.style.transform = transform
    else animateTo(ref.current!, { transform }, animation)
    setMounted(true)
    // eslint-disable-next-line
  }, [route])

  return (
    <Screen>
      <Appbar
        title={route?.name ?? 'Settings'}
        back={route ? '!/settings' : '/profile'}
        {...(route && {
          async backAction() {
            await animateTo(
              ref.current!,
              { transform: 'translateX(0)' },
              animation
            )
            history.push('/settings')
          },
        })}
      />
      <S.Container>
        <S.Page ref={ref}>
          <Main isDesktop={isDesktop} />
          <S.SubWrap>{switchComp}</S.SubWrap>
        </S.Page>
      </S.Container>
    </Screen>
  )
}

function Main({ isDesktop }: { isDesktop: boolean }) {
  return (
    <S.Menu>
      <ol>
        {routes.map(({ name, path = name.toLowerCase(), icon }) => (
          <Link key={path} icon={icon} to={path} isDesktop={isDesktop}>
            {name}
          </Link>
        ))}
      </ol>
    </S.Menu>
  )
}

type LinkProps = {
  to?: string
  children: string
  icon: ReactProps<typeof Icon>['icon']
  isDesktop: boolean
}

const Link: React.FunctionComponent<LinkProps> = ({
  children,
  to = children.toLowerCase(),
  icon,
  isDesktop,
}) => (
  <li>
    <HLink to={`/settings/${to}`} nav={isDesktop ? 'h1' : true}>
      <Icon icon={icon} />
      {children}
    </HLink>
  </li>
)

const S = {
  Container: styled.div`
    overflow-x: hidden;
    height: 100%;

    @media ${mobile} {
      width: 100vw;
    }
  `,

  Page: styled.div`
    display: flex;
    height: 100%;
    width: 200vw;
    overflow-y: hidden;
    --nav-size: 3.5rem;

    & > * {
      width: 100vw;
      flex-shrink: 0;
      overflow-y: auto;
    }

    @media ${desktop} {
      --padd: 2rem;
      padding: var(--padd);
      width: unset;

      & > * {
        width: unset;
        flex-shrink: unset;
      }
    }
  `,

  Menu: styled.nav`
    padding: 0.5rem 0;

    li:not(:last-of-type) {
      border-bottom: 1px solid var(--cl-border-light);
    }

    a {
      height: var(--nav-size);
      display: flex;
      text-decoration: none;
      align-items: center;

      svg {
        width: var(--nav-size);
      }
    }

    @media ${desktop} {
      padding: 0;
      padding-right: 2rem;
      max-width: 20rem;
      width: calc((100vw - var(--sidebar-width)) / 3);

      a[aria-current] {
        background-color: var(--cl-surface);
      }
    }
  `,

  SubWrap: styled.div`
    @media ${desktop} {
      flex-grow: 1;
      margin-right: calc(var(--padd) * -1);
      margin-bottom: calc(var(--padd) * -1);
      padding-right: var(--padd);
      padding-bottom: var(--padd);
      margin-left: 1vw;
    }
  `,
}
