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
      {icons[icon][style ?? (theme === 'dark' ? 'outlined' : 'filled')] ??
        icons[icon].filled}
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
  person: {
    filled:
      'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    outlined:
      'M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0 10c2.7 0 5.8 1.29 6 2H6c.23-.72 3.31-2 6-2m0-12C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  },
})

type SvgIcon<T = JSX.Element> = {
  filled: T
  outlined?: T
}

function buildSvgPaths<T extends { [k: string]: string | SvgIcon<string> }>(
  paths: T
): { [k in keyof T]: SvgIcon } {
  return Object.fromEntries(
    Object.entries(paths).map(([k, v]) => [
      k,
      Object.fromEntries(
        Object.entries(
          typeof v === 'string' ? { filled: v } : v
        ).map(([k, v]) => [k, <path d={v} />])
      ) as SvgIcon,
    ])
  ) as { [k in keyof T]: SvgIcon }
}
