import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

type Props = {
  open: boolean
  onClose(): void
}

export const Dialog: React.FC<Props> = ({ open, onClose, children }) => {
  const [ref, setRef] = useState<HTMLDialogElement | null>(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const close = useCallback(onClose, [])

  useEffect(() => {
    if (!ref) return
    if (open === ref.open) return
    if (open) ref.showModal?.()
    else ref.close?.()
    return listenClose(ref, close)
  }, [ref, open, close])

  return createPortal(
    <Comp ref={setRef} hidden={!open}>
      {children}
    </Comp>,
    document.getElementById('root')!
  )
}

const Base = styled.dialog`
  width: clamp(25rem, 30vw, 45rem);
  max-width: 100vw;
  max-height: 100vh;
  overflow-y: auto;
  min-height: 10rem;
  background-color: var(--cl-surface);
  color: var(--cl-text);

  p + p {
    margin-top: 0.5rem;
  }
`

const S = {
  Dialog: styled(Base)`
    border: none;

    &::backdrop {
      backdrop-filter: blur(2px);
    }
  `,

  Fallback: styled(Base).attrs(() => ({ as: 'div' }))`
    border: 0.2rem solid var(--cl-border);
    z-index: 5000;
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    padding: 1rem;
  `,
}

let listenClose = (ref: HTMLDialogElement, onClose: () => void) => {
  ref.addEventListener('close', onClose)
  return () => ref.removeEventListener('close', onClose)
}
let Comp = S.Dialog

if (!('HTMLDialogElement' in window)) {
  Comp = S.Fallback
  listenClose = (_, onClose) => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }
}
