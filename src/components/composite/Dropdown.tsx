import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Surface } from 'components/structure'

type Props = {
  visible?: boolean
  onToggle?(v: boolean): void
}

export const Dropdown: React.FC<Props> = ({
  visible = true,
  children,
  onToggle,
}) => {
  const toggleRef = useRef(onToggle)

  useEffect(() => {
    const toggle = toggleRef.current
    if (!toggle || !visible) return
    const onClick = () => toggle(false)
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [visible])

  if (!visible) return null
  return (
    <Surface
      sc={S.Menu}
      el={10}
      onClick={(e: any) => {
        e.stopPropagation()
        onToggle?.(false)
      }}
    >
      {React.Children.map(children, v => (
        <S.Item>{v}</S.Item>
      ))}
    </Surface>
  )
}

const S = {
  Menu: styled.ol`
    position: absolute;
    top: 100%;
    right: 0;
    padding: 0;
    border-radius: 0.25rem;
  `,

  Item: styled.li`
    height: 2.5rem;
    line-height: 2.5rem;
    white-space: nowrap;
    font-size: 0.9rem;
    color: var(--cl-text-strong);

    & > *:first-child {
      height: 100%;
      width: 100%;
      line-height: inherit;
      font-size: inherit;
      color: inherit;
      padding: 0 1.5rem;
      text-decoration: none;
      display: block;
    }

    button {
      appearance: none;
      background-color: transparent;
      border: none;
      padding: 0;
      cursor: pointer;
      text-align: left;

      &:focus {
        outline: none;
      }
    }
  `,
}
