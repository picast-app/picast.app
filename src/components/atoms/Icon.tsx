import React from 'react'
import styled from 'styled-components'
import { useTheme } from 'utils/hooks'

type Props = {
  icon: keyof typeof icons
  style?: keyof SvgIcon
}

export function Icon({ icon, style }: Props) {
  const theme = useTheme()

  return (
    <S.Icon viewBox="0 0 24 24">
      <path
        d={
          icons[icon][style ?? (theme === 'dark' ? 'outlined' : 'filled')] ??
          icons[icon].filled
        }
      />
    </S.Icon>
  )
}

const S = {
  Icon: styled.svg`
    width: 24px;
    height: 24px;
    fill: var(--cl-text);
  `,
}

const icons = buildSvgPaths({
  library:
    'M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z',
  subscriptions: {
    filled:
      'M20 8H4V6h16v2zm-2-6H6v2h12V2zm4 10v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2zm-6 4l-6-3.27v6.53L16 16z',
    outlined:
      'M4 6h16v2H4zm2-4h12v2H6zm14 8H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm0 10H4v-8h16v8zm-10-7.27v6.53L16 16z',
  },
})

type SvgIcon = {
  filled: string
  outlined?: string
}

function buildSvgPaths<T extends { [k: string]: string | SvgIcon }>(
  paths: T
): { [k in keyof T]: SvgIcon } {
  return Object.fromEntries(
    Object.entries(paths).map(([k, v]) => [
      k,
      typeof v === 'string' ? { filled: v } : v,
    ])
  ) as { [k in keyof T]: SvgIcon }
}
