import React, { useState } from 'react'
import styled from 'styled-components'
import Episode from './EpisodeStrip'
import { desktop } from 'styles/responsive'
import { useFeed, useComputed, useScrollPos } from 'utils/hooks'
import ReactDOMServer from 'react-dom/server'
import * as cl from 'utils/css/color'

type Props = {
  id: string
  total?: number
  onLoading(v: boolean): void
}

const itemHeight = 3.8 * 16

export default function Episodes({ id, total = 100, onLoading }: Props) {
  const [ref, setRef] = useState<HTMLOListElement | null>(null)
  const scrollTarget = useComputed(ref, el => el?.parentElement)
  const scrollPos = useScrollPos(scrollTarget)
  const feed = useFeed(id)

  const ep = useComputed(total, n =>
    Array(n)
      .fill(0)
      .map((_, i) => i)
  )
  const num = (window.innerHeight / itemHeight) * 3
  const off = Math.max(
    scrollPos / itemHeight - window.innerHeight / itemHeight / 2,
    0
  )

  if (!feed) return null
  return (
    <S.Feed episodes={total ?? 10} ref={setRef}>
      {ep.slice(off, num + off).map(i => (
        <Episode key={i} feed={feed} index={i} />
      ))}
    </S.Feed>
  )
}

const bdCl = cl.format.hex(cl.read('border'))

const backSvg = encodeURIComponent(
  ReactDOMServer.renderToString(
    <svg xmlns="http://www.w3.org/2000/svg" width={10} height={30}>
      <line x1={0} y1={0} x2={10} y2={0} stroke={bdCl} strokeWidth={1}></line>
    </svg>
  )
)

const S = {
  Feed: styled.ol<{ episodes: number }>`
    position: relative;

    @media ${desktop} {
      margin: 1rem 1.5rem;
    }

    --item-height: ${itemHeight}px;
    height: calc(var(--item-height) * ${({ episodes }) => episodes});

    background-image: url('data:image/svg+xml,${backSvg}');
    background-size: 100% var(--item-height);
  `,
}
