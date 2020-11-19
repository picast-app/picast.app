import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { bar } from 'styles/mixin'
import { Icon, Link, ProgressSC } from 'components/atoms'
import { Surface } from 'components/structure'
import { useScrollDir, useMatchMedia } from 'utils/hooks'
import { desktop } from 'styles/responsive'
import { useHistory } from 'react-router-dom'

type Props = {
  title?: string
  children?: JSX.Element
  back?: string
  scrollOut?: boolean
}

export default function Appbar({ title, back, children, scrollOut }: Props) {
  const isDesktop = useMatchMedia(desktop)
  const history = useHistory()
  const lastPath = (history.location.state as any)?.previous

  if (isDesktop) return null
  const appbar = (
    <Surface el={4} sc={S.AppBar}>
      {back && (
        <S.BackWrap
          {...(!back.startsWith('!') && lastPath
            ? {
                as: 'button',
                onClick() {
                  history.goBack()
                },
              }
            : { to: back.replace(/^!/, '') })}
        >
          <Icon icon="arrow_back" aria-hidden />
          <span>Go Back</span>
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

  ${ProgressSC} {
    top: unset;
    bottom: 0;
  }
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
    top: calc(var(--padd) * -1);
    left: calc(var(--padd) * -1);
    width: calc(100% + 2 * var(--padd));
    height: var(--height);
    margin-top: calc(var(--bar-height) * -1);
    margin-bottom: calc(var(--height) * -1 + var(--bar-height));
    display: flex;
    flex-direction: column;
    pointer-events: none;

    ${SAppBar} {
      position: sticky;
      top: calc(var(--bar-height) * -1 - var(--padd));
      pointer-events: initial;
    }
  `,

  BackWrap: styled(Link)`
    margin-right: 1rem;
    appearance: none;
    background-color: transparent;
    border: none;
    padding: 0;

    span:not(:focus):not(:active) {
      clip: rect(0 0 0 0);
      clip-path: inset(100%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px;
    }
  `,
}
