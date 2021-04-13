import React from 'react'
import styled from 'styled-components'

export function Queue() {
  const list = Array(10)
    .fill(0)
    .map((_, i) => i + 1)

  return (
    <S.Queue>
      {list.map(v => (
        <S.Entry key={v}>{v}</S.Entry>
      ))}
    </S.Queue>
  )
}

const S = {
  Queue: styled.ol``,

  Entry: styled.li``,
}
