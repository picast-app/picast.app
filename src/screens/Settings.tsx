import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Switch, Redirect, Route, useHistory } from 'react-router-dom'
import { Screen } from 'components/structure'
import Appbar from 'components/Appbar'
import { Link as HLink, Icon } from 'components/atoms'
import { scrollTo } from 'utils/animate'

type SettingsRoute = {
  name: string
  path?: string
  icon: ReactProps<typeof Icon>['icon']
  component?: any
}
const routes: SettingsRoute[] = [
  { name: 'General', icon: 'gear' },
  { name: 'Theme', icon: 'palette', component: Theme },
  { name: 'Notifications', icon: 'bell' },
]

const switchComp = (
  <Switch>
    {routes.map(
      ({ name, path = name.toLowerCase(), component = () => <div /> }) => (
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

export default function Settings() {
  const ref = useRef<HTMLDivElement>(null)
  const history = useHistory()
  const [mounted, setMounted] = useState(false)

  const path = location.pathname.split('/').slice(2)[0]
  const route = routes.find(v => (v.path ?? v.name.toLowerCase()) === path)

  useEffect(() => {
    const isSub = ref.current!.scrollLeft > 0
    if (isSub === !!route) return

    ref.current!.scrollTo({
      left: route ? window.innerWidth : 0,
      behavior: mounted ? 'smooth' : 'auto',
    })
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
            await scrollTo(ref.current!, { left: 0, behavior: 'smooth' })
            history.push('/settings')
          },
        })}
      />
      <S.Page ref={ref}>
        <Main />
        <div>{switchComp}</div>
      </S.Page>
    </Screen>
  )
}

function Main() {
  return (
    <S.Menu>
      <ol>
        {routes.map(({ name, path = name.toLowerCase(), icon }) => (
          <Link key={path} icon={icon} to={path}>
            {name}
          </Link>
        ))}
      </ol>
    </S.Menu>
  )
}

function Theme() {
  return (
    <div>
      {Array(100)
        .fill(0)
        .map((_, i) => (
          <p key={i}>{i}</p>
        ))}
    </div>
  )
}

type LinkProps = {
  to?: string
  children: string
  icon: ReactProps<typeof Icon>['icon']
}

const Link: React.FunctionComponent<LinkProps> = ({
  children,
  to = children.toLowerCase(),
  icon,
}) => (
  <li>
    <HLink to={`/settings/${to}`}>
      <Icon icon={icon} />
      {children}
    </HLink>
  </li>
)

const S = {
  Page: styled.div`
    display: flex;
    height: 100%;
    overflow: hidden;

    & > * {
      width: 100vw;
      flex-shrink: 0;
      overflow-y: auto;
    }
  `,

  Menu: styled.nav`
    padding: 1rem;

    a {
      height: 2.5rem;

      display: flex;
      text-decoration: none;
      align-items: center;

      svg {
        width: 2.5rem;
      }
    }
  `,
}
