import React from 'react'
import { Link as RouterLink } from 'react-router-dom'

type Props = ReactProps<typeof RouterLink>

export const Link = ({ children, ...props }: Props) => (
  <RouterLink {...props}>{children}</RouterLink>
)
