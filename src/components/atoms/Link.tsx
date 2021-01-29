import React from 'react'
import styled from 'styled-components'
import { Link as RouterLink } from 'react-router-dom'

type Props = {
  append?: boolean
  to: string
  wrap?: boolean
  nav?: boolean | string
} & ReactProps<typeof RouterLink>

export const Link = ({ children, to, append, wrap, nav, ...props }: Props) => {
  const isExternal = /^https?:\/\//.test(to)
  const link = (
    <SLink
      {...(isExternal
        ? { to, target: '_blank', rel: 'noopener noreferrer' }
        : {
            to: {
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
    </SLink>
  )
  if (typeof nav !== 'string') return link
  const Wrap: 'h1' = nav as any
  return <Wrap>{link}</Wrap>
}

const SLink = styled(RouterLink)`
  color: var(--cl-text);
`
