import React from 'react'
import styled from 'styled-components'

type Props = {
  src?: string | null
  title?: string
}

export function Artwork({ src, title = '' }: Props) {
  return (
    <S.Artwork
      src={
        src ||
        'data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='
      }
      alt={title}
      width={200}
      height={200}
    />
  )
}

const S = {
  Artwork: styled.img`
    height: auto;
    max-width: 100%;
    flex-shrink: 0;
    display: block;
  `,
}
