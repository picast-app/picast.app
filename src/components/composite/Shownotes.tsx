import React from 'react'
import styled from 'styled-components'
import { useStateX } from 'hooks'

type Props = {
  id: EpisodeId
}

export const Shownotes: React.FC<
  Props & Omit<React.HTMLProps<HTMLDivElement>, keyof Props>
> = ({ id }) => {
  const [notes] = useStateX('episodes.*.*.shownotes', ...id)
  return (
    <Notes
      dangerouslySetInnerHTML={{ __html: notes ?? '' }}
      ref={el =>
        el?.querySelectorAll<HTMLAnchorElement>('a').forEach(a => {
          a.setAttribute('target', '_blank')
          a.setAttribute('rel', 'noopener noreferrer')
        })
      }
    />
  )
}

const Notes = styled.div`
  line-height: 1.2;

  a {
    color: var(--cl-primary);
  }

  * ~ p {
    margin-top: 0.7em;
  }
`
