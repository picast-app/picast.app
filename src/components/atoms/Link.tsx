import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { setUrl } from 'routing/url'
import { useComputed } from 'utils/hooks'

type Props = {
  append?: boolean
  to: string
  wrap?: boolean
  nav?: boolean | string
  independent?: boolean
} & ReactProps<typeof RouterLink>

export const Link = ({
  children,
  to,
  append,
  wrap,
  nav,
  independent,
  ...props
}: Props) => {
  const isExternal = /^https?:\/\//.test(to)
  if (/^[?#]/.test(to)) to = location.pathname + to

  const Comp: any = isExternal ? 'a' : independent ? Independent : RouterLink

  const link = (
    <Comp
      {...(isExternal
        ? {
            href: to,
            as: 'a',
            target: '_blank',
            rel: 'noopener noreferrer',
          }
        : {
            to: independent
              ? to
              : {
                  pathname: append
                    ? `${location.pathname}/${to}`.replace(/\/+/g, '/')
                    : to,
                  state: { previous: location.pathname + location.search },
                },
          })}
      {...(wrap && { style: { display: 'contents', textDecoration: 'none' } })}
      {...(nav && location.pathname === to && { 'aria-current': 'page' })}
      {...props}
    >
      {children}
    </Comp>
  )
  if (typeof nav !== 'string') return link
  const Wrap: 'h1' = nav as any
  return <Wrap>{link}</Wrap>
}

function Independent({ to, children }: Props) {
  const url = useComputed(to, to => {
    const [base, rest] = to.split(/[?#]/)
    const path = base.startsWith('/')
      ? base
      : `${location.pathname.replace(/^\/$/, '')}/${base}`
    const [qs, hash] = rest?.split('#')
    return { path, query: qs?.replace(/^\?/, ''), hash }
  })

  return (
    <a
      href={to}
      onClick={e => {
        e.preventDefault()
        setUrl(url)
      }}
    >
      {children}
    </a>
  )
}
