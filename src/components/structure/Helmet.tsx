import React from 'react'
import { Helmet as ReactHelmet } from 'react-helmet-async'

type Props = {
  title?: string
  join?: string
}

export const Helmet: React.FC<Props> = ({ children, title, join = '|' }) => {
  return (
    <ReactHelmet titleTemplate={`%s ${join} Picast`}>
      {title && <title>{title}</title>}
      {children}
    </ReactHelmet>
  )
}
