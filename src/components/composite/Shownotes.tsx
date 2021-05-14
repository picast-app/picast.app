import React from 'react'
import styled from 'styled-components'

type Props = React.HTMLProps<HTMLDivElement> & {
  children?: string
}

export const Shownotes: React.FC<Props> = ({
  children: __html = '',
  ...props
}) => (
  // @ts-ignore
  <Notes
    dangerouslySetInnerHTML={{ __html }}
    {...props}
    ref={el =>
      el?.querySelectorAll<HTMLAnchorElement>('a').forEach(a => {
        a.setAttribute('target', '_blank')
        a.setAttribute('rel', 'noopener noreferrer')
      })
    }
  />
)

const Notes = styled.div`
  line-height: 1.2;

  a {
    color: var(--cl-primary);
  }

  * ~ p {
    margin-top: 0.7em;
  }
`
