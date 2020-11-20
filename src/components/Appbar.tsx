import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { bar } from 'styles/mixin'
import { Icon, ProgressSC } from 'components/atoms'
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
        <Icon
          icon="arrow_back"
          aria-hidden
          {...(!back.startsWith('!') && lastPath
            ? { onClick: history.goBack, label: 'go back' }
            : { linkTo: back.replace(/^!/, '') })}
        />
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
  z-index: 1000;

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

    * + & {
      margin-left: 1rem;
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
}

export const AppbarSC = {
  Bar: SAppBar,
  Wrap: S.ScrollWrap,
}
