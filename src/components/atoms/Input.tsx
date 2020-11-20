import React from 'react'
import ReactDOMServer from 'react-dom/server'
import styled from 'styled-components'
import type { StyledComponent } from 'styled-components'
import { Icon } from './Icon'

type Props = {
  value?: string
  onChange?(v: string): void
  blend?: boolean
  style?: string | StyledComponent<'input', any>
  type?: string
}

export function Input({ value = '', onChange, blend, style, type }: Props) {
  return (
    <S.Input
      value={value}
      onChange={({ target }) => onChange?.(target.value)}
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
}

const cancelSvg = encodeURIComponent(
  ReactDOMServer.renderToString(<Icon icon="cancel" />).replace(
    /class="[^"]*"/,
    'fill="#fffc"'
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
  `,
}
