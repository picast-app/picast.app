import React, { useState } from 'react'
import styled from 'styled-components'
import { Icon, Link } from 'components/atoms'
import { Dropdown } from 'components/composite'
import { mobile } from 'styles/responsive'

type Props = {
  feed?: string
}

export default function ContextMenu({ feed }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <S.Wrap>
      <Icon
        icon="more"
        onClick={() => setExpanded(!expanded)}
        label="context menu"
      />
      <Dropdown visible={expanded} onToggle={setExpanded}>
        <Link to={`/feedview/${feed}`}>View Feed</Link>
      </Dropdown>
    </S.Wrap>
  )
}

const S = {
  Wrap: styled.div`
    margin-right: 1rem;
    position: relative;

    @media ${mobile} {
      display: none;
    }

    & > button {
      height: initial;
      transform: scale(0.8);
      opacity: 0.8;
    }
  `,
}
