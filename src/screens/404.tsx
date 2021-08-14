import React from 'react'
import styled from 'styled-components'
import { RouteProps, SearchParams } from '@picast-app/router'

export default function Screen404({ location }: RouteProps) {
  const pod = new SearchParams(location.search).content.pod
  if (pod) return <S.Title>Podcast with id "{pod}" does not exist.</S.Title>
  return <S.Title>404</S.Title>
}

const S = {
  Title: styled.h1`
    font-size: 2rem;
    line-height: 1.4;
    position: absolute;
    max-width: 95%;
    left: 50%;
    top: 5rem;
    transform: translateX(-50%);
  `,
}
