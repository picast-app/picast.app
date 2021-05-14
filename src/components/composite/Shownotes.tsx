import React from 'react'

type Props = React.HTMLProps<HTMLDivElement> & {
  children?: string
}

export function Shownotes({ children: __html = '', ...props }: Props) {
  return <div dangerouslySetInnerHTML={{ __html }} {...props} />
}
