import React from 'react'
import styled from 'styled-components'
import type * as T from 'gql/types'
import { Link } from 'components/atoms'
import { desktop, mobile } from 'styles/responsive'
import { lineClamp } from 'styles/mixin'

export default function Show({
  id,
  title,
  author,
  artwork,
}: T.SearchPodcast_search) {
  return (
    <S.Show>
      <Link to={`/show/${id}`}>
        <article>
          <img src={artwork ?? ''} alt={`${title} artwork`} />
          <div>
            <h1>{title}</h1>
            <span>{author}</span>
          </div>
        </article>
      </Link>
    </S.Show>
  )
}

const S = {
  Show: styled.li`
    position: relative;

    & > a {
      text-decoration: none;
    }

    & > a > article {
      display: flex;
      height: 5rem;

      & > * {
        height: 100%;
      }

      h1,
      span {
        margin-top: 0.2rem;
        line-height: 1.4;
        font-size: 0.8rem;
        height: unset;
        ${lineClamp(1)}
      }

      span {
        margin-top: 0;
        opacity: 0.7;
      }

      @media ${mobile} {
        padding: 0.5rem;

        img {
          margin-right: 1rem;
        }
      }

      @media ${desktop} {
        flex-direction: column;
        width: 100%;
        height: unset;

        img {
          width: 100%;
          border-radius: 0.25rem;
        }
      }
    }
  `,
}
