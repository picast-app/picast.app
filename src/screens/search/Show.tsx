import React from 'react'
import styled from 'styled-components'

interface Props {
  title: string
  author: string
  artwork: string
}

export default function Show({ title, author, artwork }: Props) {
  return <S.Show>{title}</S.Show>
}

const S = {
  Show: styled.li``,
}
