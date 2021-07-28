import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { mobile } from 'app/styles/responsive'
import { useMatchMedia } from 'app/hooks'

type Props = {
  onClick?(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void
  iconWrap?: string
  text?: boolean
  autoFocus?: boolean
  tabIndex?: number
  feedback?: boolean
}

export const Button: React.FC<Props> = ({
  iconWrap,
  text,
  onClick,
  children,
  feedback,
  ...props
}) => {
  const [ref, setRef] = useState<HTMLButtonElement | null>(null)

  const isMobile = useMatchMedia(mobile)
  feedback ??= isMobile
  const ripple = useRipple(feedback ? ref : null, !iconWrap)

  function handleClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    onClick?.(e)
    ripple(e)
  }

  const styles: string[] = []
  if (iconWrap) styles.push('icon-wrap')
  if (text) styles.push('text')
  return (
    <S.Button
      type="button"
      {...props}
      {...(styles.length && { ['data-style']: styles.join(' ') })}
      onClick={handleClick}
      {...(iconWrap && { title: iconWrap })}
      ref={setRef}
    >
      {children}
      {iconWrap && <S.Label>{iconWrap}</S.Label>}
    </S.Button>
  )
}

function useRipple(el: HTMLElement | null, setOrigin = true) {
  const toRef = useRef<number>()

  const cancel = useRef<() => void>()

  const cancellable = (setup: () => number, clear: (id: number) => void) => {
    cancel.current?.()
    const id = setup()
    cancel.current = () => {
      clear(id)
      cancel.current = undefined
    }
  }

  const timeout = (ms: number, cb: (...args: any[]) => void) =>
    cancellable(() => window.setTimeout(cb, ms), clearTimeout)

  const animationFrame = (cb: (...args: any[]) => void) =>
    cancellable(() => requestAnimationFrame(cb), cancelAnimationFrame)

  useEffect(() => {
    if (toRef.current) clearTimeout(toRef.current)
  }, [el])

  return (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (setOrigin) {
      const { x, y } = e.currentTarget.getBoundingClientRect()
      e.currentTarget.style.setProperty('--rx', `${e.clientX - x}px`)
      e.currentTarget.style.setProperty('--ry', `${e.clientY - y}px`)
    }

    const node = el
    if (!node) return

    if (node.classList.contains('ripple'))
      animationFrame(() => {
        node.classList.remove('ripple')
        animationFrame(animate)
      })
    else animate()

    function animate() {
      node!.classList.toggle('ripple', true)
      timeout(400, () => {
        node!.classList.toggle('ripple', false)
      })
    }
  }
}

const S = {
  Button: styled.button`
    appearance: none;
    cursor: pointer;
    --height: 2rem;
    --border-size: 2px;
    height: var(--height);
    padding: 0 1rem;
    font-family: inherit;
    font-size: 0.9rem;
    color: var(--cl-primary);
    line-height: calc(var(--height) - var(--border-size) * 2);
    background-color: var(--cl-background);
    border: var(--border-size) solid var(--cl-primary);
    border-radius: 1rem;
    -webkit-tap-highlight-color: transparent;
    position: relative;
    overflow: hidden;

    &[data-style~='icon-wrap'] {
      background-color: transparent;
      padding: 0.5rem;
      border: none;
      border-radius: 50%;
      display: block;
      width: var(--icon-size);
      height: var(--icon-size);
      box-sizing: content-box;
      position: relative;

      svg {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      }
    }

    &[data-style~='text'] {
      padding: 0;
      background-color: transparent;
      color: var(--cl-primary);
      font-size: 0.75rem;
      font-weight: 400;
      border-radius: unset;
      border: none;
      text-transform: uppercase;
      letter-spacing: 0.1rem;
    }

    &:focus {
      outline: none;
    }

    --rx: 50%;
    --ry: 50%;

    &::after {
      position: absolute;
      display: block;
      width: 5rem;
      height: 5rem;
      border-radius: 50%;
      background-color: #fff;
      left: var(--rx);
      top: var(--ry);
      transform-origin: center;
      transform: translate(-50%, -50%);
    }

    &[data-style~='icon-wrap']::after {
      width: 110%;
      height: 110%;
    }

    &.ripple::after {
      content: '';
      animation: ripple 0.4s ease-out forwards;
    }

    @keyframes ripple {
      0% {
        transform: translate(-50%, -50%) scale(0.01);
        opacity: 0.7;
      }
      100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 0;
      }
    }
  `,

  Label: styled.span`
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  `,
}
