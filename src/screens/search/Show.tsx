import React from 'react'
import styled from 'styled-components'
import type * as T from 'gql/types'

export default function Show({
  title,
  author,
  artwork,
}: T.SearchPodcast_search) {
  return <S.Show>{title}</S.Show>
}

const S = {
  Show: styled.li``,
}
