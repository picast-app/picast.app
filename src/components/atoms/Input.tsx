import React from 'react'
import ReactDOMServer from 'react-dom/server'
import styled from 'styled-components'
import type { StyledComponent } from 'styled-components'
import { Icon } from './Icon'
import * as cl from 'utils/css/color'

type Props = {
  value?: string
  onChange?(v: string, target: EventTarget & HTMLInputElement): void
  blend?: boolean
  style?: string | StyledComponent<'input', any>
  type?: string
  required?: boolean
  pattern?: string
  minLength?: number
  actions?: JSX.Element[]
  disabled?: boolean
  autoComplete?: string
  autoFocus?: boolean
}

export function Input({
  value = '',
  onChange,
  blend,
  style,
  type,
  actions,
  ...props
}: Props & Omit<React.HTMLAttributes<HTMLInputElement>, keyof Props>) {
  const input = (
    <S.Input
      {...props}
      value={value}
      onChange={({ target }) => onChange?.(target.value, target)}
      data-style={blend ? 'blend' : 'default'}
      type={type}
      {...(style && {
        extend:
          typeof style === 'string'
            ? style
            : (style as any).componentStyle?.rules?.raw?.join?.('\n'),
      })}
    />
  )
  if (!actions?.length) return input
  return (
    <S.Wrap>
      {input}
      <S.Actions onClick={e => e.preventDefault()}>
        {React.Children.toArray(actions).map((el, i) =>
          React.isValidElement(el)
            ? React.cloneElement(el, { key: el.key ?? i, tabIndex: -1 })
            : el
        )}
      </S.Actions>
    </S.Wrap>
  )
}

const clearColor = cl.format.hex(cl.read('text'))
const cancelSvg = encodeURIComponent(
  ReactDOMServer.renderToString(<Icon icon="cancel" />).replace(
    /class="[^"]*"/,
    `fill="${clearColor}"`
  )
)

const S = {
  Input: styled.input<{ extend?: string }>`
    appearance: none;
    font: inherit;
    color: inherit;
    background-color: var(--cl-surface);
    border-radius: 0.25rem;
    border: none;
    padding: 0.3rem 0.5rem;
    font-size: 0.85rem;
    width: 20rem;
    max-width: 100%;

    &[data-style~='blend'] {
      border: none;
      background-color: transparent;
      border-radius: none;
    }

    &:focus {
      outline: none;
    }

    &[type='search']::-webkit-search-cancel-button {
      -webkit-appearance: none;
      background: url('data:image/svg+xml,${cancelSvg}');
      height: 1rem;
      width: 1rem;
      cursor: pointer;
    }

    ${({ extend }) => extend ?? ''}

    &.incorrect {
      border-color: var(--cl-error);
      color: var(--cl-error);
      animation: 0.15s linear 0s 2 forwards shake;
    }

    @keyframes shake {
      0% {
        transform: translateX(0);
      }
      25% {
        transform: translateX(0.2rem);
      }
      75% {
        transform: translateX(-0.2rem);
      }
      100% {
        transform: translateX(0);
      }
    }
  `,

  Wrap: styled.div`
    position: relative;
    height: 3rem;

    /* correct for lastpass widget */
    input[autocomplete='off'] + div {
      transform: translateX(-25px);
    }
  `,

  Actions: styled.div`
    display: flex;
    position: absolute;
    top: 0;
    right: 0;
    margin-right: 0.5rem;
    height: 100%;
    align-items: center;

    svg {
      opacity: 0.4;
      height: 1.4rem;
    }
  `,
}
