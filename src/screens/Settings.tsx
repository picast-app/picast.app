import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import {
  Switch,
  Route,
  Redirect,
  useLocation,
  Link as HLink,
} from '@picast-app/router'
import { Screen } from 'components/structure'
import Appbar from 'components/Appbar'
import { Icon } from 'components/atoms'
import { animateTo } from 'utils/animate'
import { desktop, mobile } from 'styles/responsive'
import { useMatchMedia } from 'utils/hooks'
import About from './settings/About'
import Appearance from './settings/Appearance'
import Debug from './settings/Debug'
import Storage from './settings/Storage'
import Notifications from './settings/Notifications'

type SettingsRoute = {
  name: string
  path?: string
  icon: ReactProps<typeof Icon>['icon']
  component?: any
  cond?: boolean
}

let routes: SettingsRoute[] = [
  { name: $.c`general`, icon: 'gear' },
  { name: $.c`appearance`, icon: 'palette', component: Appearance },
  { name: $.c`notifications`, icon: 'bell', component: Notifications },
  {
    name: $.c`storage`,
    icon: 'storage',
    component: Storage,
    cond: 'storage' in navigator,
  },
  { name: $.c`debug`, icon: 'bug', component: Debug },
  { name: $.c`about`, icon: 'info', component: About },
]
routes = routes
  .filter(({ cond }) => cond !== false)
  .map(v => ({ path: `/settings/${v.name.toLowerCase()}`, ...v }))

const animation = { duration: 200, easing: 'ease' }

export default function Settings() {
  const ref = useRef<HTMLDivElement>(null)
  const { path } = useLocation()
  const mounted = useRef(path === '/settings')
  const isDesktop = useMatchMedia(desktop)
  const route = routes.find(v => v.path === path)

  useEffect(() => {
    if (isDesktop) return
    const isSub = ref.current!.scrollLeft > 0
    if (isSub && !!route) return
    const transform = `translateX(${route ? '-100vw' : 0})`
    if (!mounted.current) ref.current!.style.transform = transform
    else animateTo(ref.current!, { transform }, animation)
    mounted.current = true
  }, [route, isDesktop])

  return (
    <Screen>
      <Appbar
        title={route?.name ?? 'Settings'}
        back={route ? '/settings' : '/profile'}
      />
      <S.Container>
        <S.Page ref={ref}>
          <Main isDesktop={isDesktop} />
          <S.SubWrap>
            <Routes isDesktop={isDesktop} />
          </S.SubWrap>
        </S.Page>
      </S.Container>
    </Screen>
  )
}

const Routes = ({ isDesktop }: { isDesktop: boolean }) => (
  <Switch>
    {routes.map(({ name, path, component = () => <div>{name}</div> }) => (
      <Route key={path} path={path!}>
        {component}
      </Route>
    ))}
    {isDesktop && <Redirect to="/settings/appearance" />}
  </Switch>
)

const Main = ({ isDesktop }: { isDesktop: boolean }) => (
  <S.Menu>
    <ol>
      {routes.map(({ name, path, icon }) => (
        <Link key={path} icon={icon} to={path} isDesktop={isDesktop}>
          {name}
        </Link>
      ))}
    </ol>
  </S.Menu>
)

type LinkProps = {
  to?: string
  children: string
  icon: ReactProps<typeof Icon>['icon']
  isDesktop: boolean
}

const Link: React.FunctionComponent<LinkProps> = ({
  children,
  to,
  icon,
  isDesktop,
}) => {
  const location = useLocation()
  const current = location.path === to

  const Wrap = current && isDesktop ? 'h1' : React.Fragment
  return (
    <li>
      <HLink to={to!} {...(current && { 'aria-current': 'page' })}>
        <Wrap>
          <Icon icon={icon} />
          {children}
        </Wrap>
      </HLink>
    </li>
  )
}

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
    flex-shrink: 0;

    li:not(:last-of-type) {
      border-bottom: 1px solid var(--cl-border-light);
    }

    a:not([aria-active]),
    a > h1 {
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

        html[data-theme='light'] & {
          background-color: var(--cl-border-light);
        }
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
