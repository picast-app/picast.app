import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Bar } from './styledComponents'
import { Icon } from 'components/atoms'
import { useScrollDir } from 'utils/hooks'

type Props = {
  title?: string
  children?: JSX.Element
  back?: string
  scrollOut?: boolean
}

export default function Appbar({ title, back, children, scrollOut }: Props) {
  const appbar = (
    <S.AppBar>
      {back && <Icon icon="arrow_back" linkTo={back} />}
      {title && <S.Title>{title}</S.Title>}
      {children}
    </S.AppBar>
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

const S = {
  AppBar: styled(Bar)`
    top: 0;
    display: flex;
    align-items: center;
    padding: 0 1rem;
  `,

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
    width: 100vw;
    display: flex;
    flex-direction: column;
    pointer-events: none;

    ${Bar} {
      position: sticky;
      top: calc(var(--bar-height) * -1);
      pointer-events: initial;
    }
  `,
}
