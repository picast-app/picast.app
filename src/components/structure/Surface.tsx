import React, { forwardRef } from 'react'
import styled, { AnyStyledComponent } from 'styled-components'
import * as cl from 'utils/css/color'
import { shadow } from 'styles/shadow'
import { useTheme } from 'hooks'
import { easeOutCubic } from 'utils/ease'

type Props = {
  sc?: AnyStyledComponent
  el?: number
  alt?: boolean
  onClick?(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void
  id?: string
} & Record<string, any>

const _Surface: React.ForwardRefRenderFunction<HTMLDivElement, Props> = (
  { sc, el = 0, alt, children, ...props },
  ref
) => {
  const theme = useTheme()
  return (
    <S.Surface
      as={sc}
      el={el}
      {...(el === 0 && {
        border: cl.format.hex(
          cl.blend(cl.read('text'), cl.alpha(cl.read('background'), 0xe8))
        ),
      })}
      color={
        theme === 'light'
          ? 'var(--cl-background)'
          : cl.format.hex(
              cl.blend(
                cl.read('background'),
                cl.alpha(cl.read('surface'), 0xff * easeOutCubic(el / 24))
              )
            )
      }
      {...(alt && { 'data-style': 'alt' })}
      data-theme={theme}
      {...props}
      ref={ref}
    >
      {children}
    </S.Surface>
  )
}

export const Surface = forwardRef<HTMLDivElement, Props>(_Surface)

const S = {
  Surface: styled.div<{ border?: string; el: number; color: string }>`
    background-color: ${({ color }) => color};
    ${({ el, border }) =>
      border ? `border: 1px solid ${border};` : shadow(el)}

    &[data-style~='alt'][data-theme='light'] {
      background-color: var(--cl-surface-alt);
      border: none;

      --cl-text: var(--cl-text-alt);
      --cl-text-strong: var(--cl-text-alt-strong);
      --cl-icon: var(--cl-text-strong);
    }
  `,
}
