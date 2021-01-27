import React from 'react'
import styled from 'styled-components'
import { Link } from './Link'
import { useTheme } from 'utils/hooks'
import { Button } from './Button'

type Props = {
  icon: keyof typeof icons
  style?: keyof SvgIcon
  linkTo?: string
  onClick?(): void
  label?: string
}

export const Icon: React.FC<Props> = ({
  icon,
  style,
  linkTo,
  onClick,
  label,
  ...props
}) => {
  const theme = useTheme()
  const svg = (
    <S.Icon viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      {icons[icon][style ?? (theme === 'dark' ? 'outlined' : 'filled')] ??
        icons[icon].filled}
    </S.Icon>
  )
  if (linkTo) return <Link to={linkTo}>{svg}</Link>
  if (onClick)
    return (
      <Button iconWrap={label} onClick={onClick}>
        {svg}
      </Button>
    )
  return svg
}

const S = {
  Icon: styled.svg`
    width: 24px;
    height: 24px;
    fill: var(--cl-icon);
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
  search:
    'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  arrow_back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  arrow_down: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z',
  arrow:
    'M18.3,14.29L18.3,14.29c-0.39-0.39-1.02-0.39-1.41,0L13,18.17V3c0-0.55-0.45-1-1-1h0c-0.55,0-1,0.45-1,1v15.18l-3.88-3.88 c-0.39-0.39-1.02-0.39-1.41,0l0,0c-0.39,0.39-0.39,1.02,0,1.41l5.59,5.59c0.39,0.39,1.02,0.39,1.41,0l5.59-5.59 C18.68,15.32,18.68,14.68,18.3,14.29z',
  cancel:
    'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  expand_more: 'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z',
  expand_less: 'M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z',
  play:
    'M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z',
  pause:
    'M8 19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2v10c0 1.1.9 2 2 2zm6-12v10c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2z',
  skip:
    'M18.9201 12.9999C18.4201 12.9999 18.0101 13.3699 17.9401 13.8599C17.4601 17.2299 14.1701 19.6999 10.5201 18.8199C8.27012 18.2799 6.61012 16.5499 6.13012 14.2899C5.32012 10.4199 8.27012 6.99994 12.0001 6.99994V9.78994C12.0001 10.2399 12.5401 10.4599 12.8501 10.1399L16.6401 6.34994C16.8401 6.14994 16.8401 5.83994 16.6401 5.63994L12.8501 1.84994C12.5401 1.53994 12.0001 1.75994 12.0001 2.20994V4.99994C7.06012 4.99994 3.16012 9.47994 4.16012 14.5999C4.76012 17.7099 7.06012 20.0999 10.1501 20.7899C14.9801 21.8699 19.3001 18.5899 19.9201 14.1199C20.0101 13.5299 19.5201 12.9999 18.9201 12.9999Z',
  more:
    'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
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
