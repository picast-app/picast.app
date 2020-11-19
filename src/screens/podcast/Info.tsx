import React, { useState } from 'react'
import styled from 'styled-components'
import { Icon } from 'components/atoms'
import { lineClamp } from 'styles/mixin'
import type * as T from 'gql/types'

export default function Info({
  id,
  title,
  author,
  artwork,
  description,
}: Partial<T.PodcastPage_podcast>) {
  const [showDescription, setShowDescription] = useState(false)

  if (!id) return null

  return (
    <S.Info>
      <S.Head>
        <div>
          <h1>{title}</h1>
          <span>{author}</span>
        </div>
        <img src={artwork as string} alt="artwork" />
      </S.Head>
      <S.Actions>
        <Icon
          icon={`expand_${showDescription ? 'less' : 'more'}` as any}
          onClick={() => setShowDescription(!showDescription)}
          label="show description"
        />
      </S.Actions>
      {showDescription && <S.Description>{description}</S.Description>}
    </S.Info>
  )
}

const S = {
  Info: styled.div`
    border-bottom: 1px solid var(--cl-text-disabled);
    padding: 1rem 1.5rem;
  `,

  Head: styled.div`
    display: flex;
    justify-content: space-between;

    img {
      height: 7rem;
      width: 7rem;
      border-radius: 0.5rem;
      margin-left: 1rem;
    }

    h1 {
      font-size: 1.3rem;
      line-height: 1.4;
      margin-top: 0.2rem;
      ${lineClamp(2)}
    }

    span {
      display: block;
      margin-top: 1rem;
      color: var(--cl-primary);
    }
  `,

  Actions: styled.div`
    display: flex;
    justify-content: flex-end;
    margin-top: 1rem;
  `,

  Description: styled.p`
    color: var(--cl-text);
    margin-top: 1rem;
    font-size: 0.9rem;
  `,
}
