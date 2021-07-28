import React, { useState } from 'react'
import styled from 'styled-components'
import { Icon } from 'app/components/atoms'
import { Link } from '@picast-app/router'
import { Dropdown } from 'app/components/composite'
import { main } from 'app/workers'

type Props = {
  id: string
  feed?: string
}

export default function ContextMenu({ id, feed }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <S.Wrap>
      <Icon icon="more" onClick={() => setExpanded(!expanded)} label="more" />
      <Dropdown visible={expanded} onToggle={setExpanded}>
        <Link to={`/feedview/${feed}`}>View Feed</Link>
        <button onClick={() => main.parse(id)}>Parse Feed</button>
        <button onClick={() => main.processCover(id)}>Process Cover</button>
        <button onClick={() => main.deletePodcast(id)}>Delete Podcast</button>
      </Dropdown>
    </S.Wrap>
  )
}

const S = {
  Wrap: styled.div`
    position: relative;
  `,
}

export const SC = S.Wrap
