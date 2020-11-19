import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { bar } from 'styles/mixin'
import { Icon, Link } from 'components/atoms'
import { Surface } from 'components/structure'
import { useScrollDir, useMatchMedia } from 'utils/hooks'
import { desktop } from 'styles/responsive'

type Props = {
  title?: string
  children?: JSX.Element
  back?: string
  scrollOut?: boolean
}

export default function Appbar({ title, back, children, scrollOut }: Props) {
  const isDesktop = useMatchMedia(desktop)

  if (isDesktop) return null
  const appbar = (
    <Surface el={4} sc={S.AppBar}>
      {back && (
        <S.BackWrap to={back}>
          <Icon icon="arrow_back" />
        </S.BackWrap>
      )}
      {title && <S.Title>{title}</S.Title>}
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
        `calc(${wrap.scrollTop}px + var(--bar-height) + ${
          bar.getBoundingClientRect().y
        }px)`
      )
  }, [dir, wrap])

  return <S.ScrollWrap ref={ref}>{children}</S.ScrollWrap>
}

const SAppBar = styled.div`
  ${bar}
  top: 0;
  display: flex;
  align-items: center;
  padding: 0 1rem;
`

const S = {
  AppBar: SAppBar,

  Title: styled.h1`
    font-size: 1.2rem;

    & + * {
      margin-left: auto;
    }
  `,

  ScrollWrap: styled.div`
    --height: var(--bar-height);

    position: relative;
    top: 0;
    left: 0;
    height: var(--height);
    margin-top: calc(var(--bar-height) * -1);
    margin-bottom: calc(var(--height) * -1 + var(--bar-height));
    width: 100%;
    display: flex;
    flex-direction: column;
    pointer-events: none;

    ${SAppBar} {
      position: sticky;
      top: calc(var(--bar-height) * -1);
      pointer-events: initial;
    }
  `,

  BackWrap: styled(Link)`
    margin-right: 1rem;
  `,
}
