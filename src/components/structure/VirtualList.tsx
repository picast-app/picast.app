import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  createElement,
  cloneElement,
  memo,
} from 'react'
import ReactDOM from 'react-dom'
import { useMatchMedia, useWindowDimensions, useValueRef } from 'hooks'
import styled from 'styled-components'
import { desktop } from 'styles/responsive'
import { scrollParent } from 'utils/dom'

export const VirtualList = memo(_VirtualList) as typeof _VirtualList

type Props<T> = {
  length: number
  children: (props: T) => JSX.Element | null
  itemProps?: (index: number) => T
}

function _VirtualList<T>({ length, itemProps, children: item }: Props<T>) {
  const [, height] = useWindowDimensions()
  const isDesktop = useMatchMedia(desktop)
  const itemHeight = isDesktop ? ITEM_HEIGHT_DESKTOP : ITEM_HEIGHT_MOBILE
  const ihRef = useRef(itemHeight)
  ihRef.current = itemHeight
  const numVisible = Math.min(Math.ceil((height / itemHeight) * 3), length)
  const total = useValueRef(length)
  const [ol, setOl] = useState<HTMLOListElement | null>(null)
  const offTop = useValueRef(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useMemo(() => ol?.offsetTop! / itemHeight + numVisible / 4, [ol, isDesktop])
  )

  const createChild = useCallback(
    i => createElement(item, itemProps?.(i)),
    [item, itemProps]
  )

  const slots = useRef(new WeakMap<HTMLElement, [number, JSX.Element]>())

  useEffect(() => {
    if (!ol) return

    while (ol.childElementCount > numVisible) {
      ReactDOM.unmountComponentAtNode(ol.lastElementChild!)
      ol.removeChild(ol.lastElementChild!)
    }

    for (let i = ol.childElementCount; i < numVisible; i++) {
      const child = document.createElement('li')
      child.style.transform = `translateY(${i * ihRef.current}px)`
      child.innerHTML = `test ${i}`
      const comp = createChild(i)
      ReactDOM.render(comp, child)
      ol.appendChild(child)
      slots.current.set(child, [i, comp])
    }
  }, [ol, numVisible, createChild])

  useEffect(() => {
    if (!ol) return
    const screen = scrollParent(ol)
    let lastY = screen.scrollTop / ihRef.current

    const onScroll = () => {
      const y = screen.scrollTop / ihRef.current
      if ((y | 0) !== (lastY | 0)) {
        const n = ol.childElementCount
        for (let i = 0; i < n; i++) {
          const item = ol.children[i] as HTMLElement
          const slot = indexSlot(i, n, y, offTop.current)
          if (slot >= total.current) continue
          const [curSlot, el] = slots.current.get(item)!
          if (curSlot !== slot) {
            item.style.transform = `translateY(${slot * ihRef.current}px)`
            const newEl = cloneElement(el, { index: slot })
            ReactDOM.unmountComponentAtNode(item)
            ReactDOM.render(newEl, item)
            slots.current.set(item, [slot, newEl])
          }
        }
      }

      lastY = y
    }

    screen.addEventListener('scroll', onScroll, { passive: true })
    return () => screen.removeEventListener('scroll', onScroll)
  }, [ol, offTop, total])

  return <List items={length} ref={setOl} />
}

function indexSlot(
  index: number,
  slots: number,
  offset: number,
  frontOffset: number
) {
  offset -= Math.min(frontOffset, offset)
  let page = (offset / slots) | 0
  if ((offset % slots | 0) >= index + 1) page++
  return page * slots + index
}

const ITEM_HEIGHT_DESKTOP = Math.round(3.8 * 16)
const ITEM_HEIGHT_MOBILE = Math.round(4.8 * 16)

const backSvg = (cl: string) =>
  `url('data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="30"><line x1="0" y1="0" x2="10" y2="0" stroke="${cl}" stroke-width="1"></line></svg>`
  )}')`

type ListAttrs = { items: number }
const List = styled.ol.attrs<ListAttrs>(({ items }) => ({
  style: { height: `calc(var(--item-height) * ${items})` },
}))<ListAttrs>`
  --item-height: ${ITEM_HEIGHT_MOBILE}px;

  @media ${desktop} {
    --item-height: ${ITEM_HEIGHT_DESKTOP}px;
  }

  position: relative;
  overflow: hidden;
  overflow: clip;
  background-image: ${backSvg('#0002')};
  background-size: 100% var(--item-height);

  html[data-theme='dark'] & {
    background-image: ${backSvg('#fff3')};
  }

  li {
    position: absolute;
    width: 100%;
    height: var(--item-height);
  }
`
