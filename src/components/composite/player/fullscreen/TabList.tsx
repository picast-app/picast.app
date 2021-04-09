import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Link } from 'components/atoms'
import { useLocation } from 'utils/hooks'
import { animateTo } from 'utils/animate'

const tabs = ['notes', 'now playing', 'queue']
const getHash = (title: string) => `#${title.split(' ').pop()?.toLowerCase()}`
const hashes = tabs.map(getHash)

export default function TabList() {
  useLocation()
  const active = hashes.indexOf(location.hash || '#playing')

  return (
    <Wrap>
      <Tabs>
        {tabs.map((title, i) => (
          <Tab key={title} active={active === i}>
            {title}
          </Tab>
        ))}
      </Tabs>
      <ActiveLine active={active} />
    </Wrap>
  )
}

function Tab({
  children,
  hash = getHash(children),
  active = false,
}: {
  children: string
  active?: boolean
  hash?: string
}) {
  return (
    <li role="presentation">
      <Link to={hash} aria-selected={active}>
        {children}
      </Link>
    </li>
  )
}

function ActiveLine({ active }: { active: number }) {
  const [ref, setRef] = useState<HTMLElement | null>()
  const [initial] = useState(active)
  const [last, setLast] = useState(active)

  useEffect(() => {
    if (!ref) return
    ref.style.transform = getLineTransform(ref, initial)
  }, [ref, initial])

  useEffect(() => {
    if (!ref) return
    setLast(active)
    if (last === active) return
    animateTo(
      ref,
      { transform: getLineTransform(ref, active) },
      { duration: 200, easing: 'ease' }
    )
  }, [ref, active, last])

  if (active < 0) return null
  return <Active ref={setRef} />
}

function getLineTransform(ref: HTMLElement, i: number) {
  const ul = ref.parentElement!.querySelector<HTMLUListElement>('ul')!
  const associate = (ul.children[i] as HTMLElement)
    .firstElementChild! as HTMLElement
  return `translateX(${associate.offsetLeft - ul.offsetLeft}px) scaleX(${
    associate.offsetWidth / 100
  })`
}

const Wrap = styled.div`
  position: relative;
  width: 100%;
  padding: 1rem 10vw;
`

const Tabs = styled.ul.attrs({ role: 'presentation' })`
  width: 100%;
  display: flex;
  justify-content: space-between;
  color: var(--cl-text-strong);

  li {
    width: 100%;
    flex-grow: 1;
    text-align: center;

    a {
      text-decoration: none;
      color: inherit;
      text-transform: capitalize;

      &:not([aria-selected='true']) {
        opacity: 0.7;
      }
    }
  }
`

const Active = styled.div`
  display: block;
  position: absolute;
  top: 100%;
  width: 100px;
  height: 0.1rem;
  border-radius: 0.05rem;
  background-color: var(--cl-text-strong);
  transform-origin: left;
`
