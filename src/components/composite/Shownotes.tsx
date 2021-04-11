import React from 'react'

type Props = {
  children?: string
}

export function Shownotes({ children: __html = '' }: Props) {
  return <div dangerouslySetInnerHTML={{ __html }} />
}
