import React from 'react'
import styled, { AnyStyledComponent } from 'styled-components'
import { css, hex, blend, alpha } from 'styles/color'
import { shadow } from 'styles/shadow'
import { useTheme } from 'utils/hooks'
import { easeOutCubic } from 'utils/ease'

type Props = {
  sc?: AnyStyledComponent
  el?: number
  alt?: boolean
}

export const Surface: React.FC<Props> = ({ sc, el = 0, alt, children }) => {
  const theme = useTheme()
  return (
    <S.Surface
      as={sc}
      el={el}
      {...(el === 0 && {
        border: hex.encode(
          blend(css.color('text'), alpha(css.color('background'), 0xe8))
        ),
      })}
      color={
        theme === 'light'
          ? 'var(--cl-background)'
          : hex.encode(
              blend(
                css.color('background'),
                alpha(css.color('surface'), 0xff * easeOutCubic(el / 24))
              )
            )
      }
      {...(alt && { 'data-style': 'alt' })}
    >
      {children}
    </S.Surface>
  )
}

const S = {
  Surface: styled.div<{ border?: string; el: number; color: string }>`
    background-color: ${({ color }) => color};
    ${({ el, border }) =>
      border ? `border: 1px solid ${border};` : shadow(el)}

    &[data-style~='alt'] {
      background-color: var(--surface-alt);
      border: none;

      --cl-text: var(--cl-text-alt);
    }
  `,
}
