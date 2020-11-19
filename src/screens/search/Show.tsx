import React from 'react'
import styled from 'styled-components'
import type * as T from 'gql/types'
import { Link } from 'components/atoms'

export default function Show({
  id,
  title,
  author,
  artwork,
}: T.SearchPodcast_search) {
  return (
    <S.Show>
      <Link to={`/show/${id}`}>
        <img src={artwork ?? ''} alt={`${title} artwork`} />
        <div>{title}</div>
      </Link>
    </S.Show>
  )
}

const S = {
  Show: styled.li`
    & > a {
      display: flex;
      height: 5rem;

      & > * {
        height: 100%;
      }
    }
  `,
}
