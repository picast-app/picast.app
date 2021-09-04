import React, { useState } from 'react'
import styled from 'styled-components'
import { set } from 'utils/array'
import { Checkbox } from 'components/atoms/Checkbox'

type Props = {
  active?: boolean[]
  loading?: number[]
  onChange?: (active: boolean[]) => void
  disabled?: boolean
}

export const CheckList: React.FC<Props> = ({
  children,
  active = [],
  loading = [],
  onChange,
  disabled,
}) => {
  const items = React.Children.toArray(children)
  const [id] = useState(((Math.random() * 1e6) | 0).toString(36))

  return (
    <ul {...(disabled && { 'data-disabled': '' })}>
      {items.map((item, i) => (
        <S.Item key={i}>
          <Checkbox
            id={`${id}-${i}`}
            checked={active[i] ?? false}
            onChange={() => onChange?.(set(active, i, !active[i]))}
            disabled={disabled}
            loading={loading.includes(i)}
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

    [data-disabled] & > *:not(input[type='checkbox']) {
      opacity: 0.3;
    }
  `,
}
