import React from 'react'
import styled from 'styled-components'
import { Bar } from './styledComponents'

type Props = {
  title: string
}

export default function Appbar({ title }: Props) {
  return (
    <S.AppBar>
      <S.Title>{title}</S.Title>
    </S.AppBar>
  )
}

const S = {
  AppBar: styled(Bar)`
    top: 0;
    display: flex;
    align-items: center;
    padding: 0 1rem;
  `,

  Title: styled.h1`
    font-size: 1.2rem;
  `,
}
