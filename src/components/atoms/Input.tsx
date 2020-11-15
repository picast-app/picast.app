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
    'fill="#fff"'
  )
)

const S = {
  Input: styled.input<{ extend?: string }>`
    appearance: none;
    font: inherit;
    color: inherit;

    &[data-style~='blend'] {
      border: none;
      background-color: transparent;
    }

    &:focus {
      outline: none;
    }

    &[type='search']::-webkit-search-cancel-button {
      -webkit-appearance: none;
      background: url('data:image/svg+xml,${cancelSvg}');
      height: 1.5rem;
      width: 1.5rem;
    }

    ${({ extend }) => extend ?? ''}
  `,
}
