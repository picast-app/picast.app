import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Button } from 'components/atoms'
import { Surface } from 'components/structure'
import { desktop } from 'styles/responsive'
import { animateTo } from 'utils/animate'

type Props = {
  text: string
  action?: string
  onAction?(): void
}

export function SnackBar({ text, action }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    animateTo(
      ref.current,
      { opacity: 1, transform: 'scale(1)' },
      { duration: 100, easing: 'ease-out' }
    )
  }, [])

  return (
    <Surface sc={S.Bar} alt role={action ? 'alertdialog' : 'alert'} ref={ref}>
      <span>{text}</span>
      {action && <Button text>{action}</Button>}
    </Surface>
  )
}

const S = {
  Bar: styled.div`
    width: 100vw;
    min-height: var(--bar-height);
    padding: 0.8rem 1rem;
    user-select: none;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    opacity: 0;
    transform: scale(0);

    span {
      color: var(--cl-text-strong);
      font-size: 1rem;
    }

    button {
      margin-left: 1rem;
    }

    @media ${desktop} {
      max-width: 20rem;
      border-radius: 0.25rem;
    }
  `,
}
