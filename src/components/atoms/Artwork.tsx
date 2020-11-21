import React from 'react'
import styled from 'styled-components'

type Props = {
  src: string
  title?: string
}

export function Artwork({ src, title = '' }: Props) {
  return <S.Artwork src={src} alt={title} width={200} height={200} />
}

const S = {
  Artwork: styled.img`
    height: auto;
    max-width: 100%;
    flex-shrink: 0;
  `,
}
