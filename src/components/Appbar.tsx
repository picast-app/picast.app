import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { bar } from 'styles/mixin'
import { Icon, ProgressSC } from 'components/atoms'
import { Surface, Helmet } from 'components/structure'
import { useScrollDir, useMatchMedia } from 'hooks'
import { desktop } from 'styles/responsive'
import { useLocation, history } from '@picast-app/router'

type Props = {
  title?: string
  children?: JSX.Element
  back?: string
  backAction?: () => void
  scrollOut?: boolean
}

export default function Appbar({
  title,
  back,
  backAction,
  children,
  scrollOut,
}: Props) {
  const isDesktop = useMatchMedia(desktop)
  const location = useLocation()

  if (isDesktop) return !title ? null : <Helmet title={title} />
  const appbar = (
    <Surface el={4} sc={S.AppBar}>
      {back && (
        <Icon
          icon="arrow_back"
          aria-hidden
          {...(back.startsWith('!') || !location.previous
            ? { linkTo: back.replace(/^!/, '') }
            : { onClick: backAction ?? history.back, label: 'go back' })}
        />
      )}
      {title && (
        <>
          <Helmet title={title} />
          <S.Title id="sc-title">{title}</S.Title>
        </>
      )}
      {children}
    </Surface>
  )
  if (!scrollOut) return appbar
  return <ScrollWrap>{appbar}</ScrollWrap>
}

const ScrollWrap: React.FC = ({ children }) => {
  const ref = useRef() as React.MutableRefObject<HTMLDivElement>
  const [wrap, setWrap] = useState<HTMLElement>()
  const dir = useScrollDir({ target: wrap })

  useEffect(() => {
    setWrap(ref.current?.parentElement ?? undefined)
  }, [ref])

  useEffect(() => {
    if (!wrap) return
    const bar = ref.current.firstChild as HTMLElement

    if (dir === 'up')
      ref.current.style.setProperty(
        '--height',
        `calc(${wrap.scrollTop}px + ${Math.max(
          bar.offsetHeight + bar.getBoundingClientRect().y,
          0
        )}px)`
      )
    else
      ref.current.style.setProperty(
        '--height',
        `calc(${wrap.scrollTop}px + var(--appbar-height) + ${
          bar.getBoundingClientRect().y
        }px)`
      )
  }, [dir, wrap])

  return <S.ScrollWrap ref={ref}>{children}</S.ScrollWrap>
}

const SAppBar = styled.div`
  ${bar}
  height: var(--appbar-height);
  top: 0;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  z-index: 1000;

  ${ProgressSC} {
    top: unset;
    bottom: 0;
    transform-origin: bottom;
  }

  svg {
    opacity: 0.85;
  }
`

const S = {
  AppBar: SAppBar,

  Title: styled.h1`
    font-size: 1.2rem;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    height: 2rem;
    line-height: 2rem;

    & + * {
      margin-left: auto;
    }

    * + & {
      margin-left: 1rem;
    }
  `,

  ScrollWrap: styled.div`
    --height: var(--appbar-height);

    position: relative;
    top: calc(var(--padd) * -1);
    left: calc(var(--padd) * -1);
    width: calc(100% + 2 * var(--padd));
    height: var(--height);
    margin-top: calc(var(--appbar-height) * -1);
    margin-bottom: calc(var(--height) * -1 + var(--appbar-height));
    display: flex;
    flex-direction: column;
    pointer-events: none;

    ${SAppBar} {
      position: sticky;
      top: calc(var(--appbar-height) * -1 - var(--padd));
      pointer-events: initial;
    }
  `,
}

export const AppbarSC = {
  Bar: SAppBar,
  Wrap: S.ScrollWrap,
}
