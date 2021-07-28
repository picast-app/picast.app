import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Button } from 'app/components/atoms'
import { Surface } from 'app/components/structure'
import { desktop } from 'app/styles/responsive'
import { animateTo } from 'app/utils/animate'

type Props = {
  text: string
  action?: string
  onAction?(): void
  lvl?: string
}

export function SnackBar({ text, action, onAction, lvl = 'info' }: Props) {
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
    <Surface
      sc={S.Bar}
      alt
      role={action ? 'alertdialog' : 'alert'}
      ref={ref}
      el={4}
      data-lvl={lvl}
    >
      <span>{text}</span>
      {action && (
        <Button text onClick={onAction}>
          {action}
        </Button>
      )}
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

    &[data-lvl='error'] {
      border: 2px solid var(--cl-error);
    }

    @media ${desktop} {
      max-width: 20rem;
      border-radius: 0.25rem;
    }
  `,
}
