import React from 'react'
import styled from 'styled-components'
import type * as T from 'gql/types'
import { Link } from 'components/atoms'
import { desktop } from 'styles/responsive'
import { lineClamp } from 'styles/mixin'

export default function Show({ id, title, artwork }: T.SearchPodcast_search) {
  return (
    <S.Show>
      <Link to={`/show/${id}`}>
        <img src={artwork ?? ''} alt={`${title} artwork`} />
        <span>{title}</span>
      </Link>
    </S.Show>
  )
}

const S = {
  Show: styled.li`
    & > a {
      display: flex;
      height: 5rem;
      text-decoration: none;

      & > * {
        height: 100%;
      }

      @media ${desktop} {
        flex-direction: column;
        width: 15rem;
        height: 19rem;
        overflow-x: hidden;

        img {
          width: 100%;
          height: 15rem;
        }

        span {
          height: unset;
          ${lineClamp(2)}
        }
      }
    }
  `,
}
