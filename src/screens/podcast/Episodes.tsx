import React, { useEffect, useState } from 'react'
import ReactDOMServer from 'react-dom/server'
import styled from 'styled-components'
import Episode from './EpisodeStrip'
import { desktop, mobile } from 'styles/responsive'
import { useFeed, useComputed, useScrollPos, useMatchMedia } from 'utils/hooks'
import { main, proxy } from 'workers'
import * as cl from 'utils/css/color'

type Props = {
  id: string
  total?: number
  onLoading(v: boolean): void
}

const desktopItemHeight = 3.8 * 16
const mobileItemHeight = 4.8 * 16

export default function Episodes({ id, total: _total, onLoading }: Props) {
  const [ref, setRef] = useState<HTMLOListElement | null>(null)
  const scrollTarget = useComputed(
    ref,
    el => el?.parentElement?.parentElement?.parentElement
  )
  const scrollPos = useScrollPos(scrollTarget)
  const feed = useFeed(id)
  const [total, setTotal] = useState(Math.max(_total ?? 100, 100))
  const isMobile = useMatchMedia(mobile)
  const itemHeight = isMobile ? mobileItemHeight : desktopItemHeight

  useEffect(() => {
    if (!_total || _total < 0) return
    setTotal(_total)
  }, [_total])

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

  useEffect(() => {
    if ((_total ?? -1) > -1) return
    let cancel: (() => void) | undefined = undefined
    main
      .onTotalChange(
        id,
        proxy(({ complete, total }) => {
          setTotal(total)
          if (complete) onLoading(false)
        })
      )
      .then(v => {
        cancel = v
      })

    return cancel
  }, [_total, onLoading, id])

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

    --item-height: ${desktopItemHeight}px;
    height: calc(var(--item-height) * ${({ episodes }) => episodes});
    overflow: hidden;

    @media ${desktop} {
      margin: 1rem 1.5rem;
    }

    @media ${mobile} {
      --item-height: ${mobileItemHeight}px;
    }

    background-image: url('data:image/svg+xml,${backSvg}');
    background-size: 100% var(--item-height);
  `,
}
