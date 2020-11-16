import React from 'react'
import styled from 'styled-components'
import { Link as RouterLink } from 'react-router-dom'

type Props = { append?: boolean; to: string } & ReactProps<typeof RouterLink>

export const Link = ({ children, to, append, ...props }: Props) => (
  <SLink
    to={append ? `${location.pathname}/${to}`.replace(/\/+/g, '/') : to}
    {...props}
  >
    {children}
  </SLink>
)

const SLink = styled(RouterLink)`
  color: var(--cl-text);
`
