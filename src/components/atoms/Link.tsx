import React from 'react'
import styled from 'styled-components'
import { Link as RouterLink } from 'react-router-dom'

type Props = { append?: boolean; to: string; wrap?: boolean } & ReactProps<
  typeof RouterLink
>

export const Link = ({ children, to, append, wrap, ...props }: Props) => {
  const isExternal = /^https?:\/\//.test(to)
  return (
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
      {...props}
    >
      {children}
    </SLink>
  )
}

const SLink = styled(RouterLink)`
  color: var(--cl-text);
`
