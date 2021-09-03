import React, { useState } from 'react'
import styled from 'styled-components'
import { set } from 'utils/array'

type Props = {
  active?: boolean[]
  onChange?: (active: boolean[]) => void
}

export const CheckList: React.FC<Props> = ({
  children,
  active = [],
  onChange,
}) => {
  const items = React.Children.toArray(children)
  const [id] = useState(((Math.random() * 1e6) | 0).toString(36))

  return (
    <ul>
      {items.map((item, i) => (
        <S.Item key={i}>
          <input
            type="checkbox"
            id={`${id}-${i}`}
            checked={active[i] ?? false}
            onChange={() => onChange?.(set(active, i, !active[i]))}
          />
          <label htmlFor={`${id}-${i}`}>{item}</label>
        </S.Item>
      ))}
    </ul>
  )
}

const S = {
  Item: styled.li`
    display: flex;
    align-items: center;

    & > *:first-child {
      margin: 0;
      margin-right: 0.5rem;
      cursor: pointer;
    }

    &:not(:first-of-type) {
      margin-top: 0.5rem;
    }
  `,
}
