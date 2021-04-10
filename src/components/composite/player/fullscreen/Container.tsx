import React, { useState, useEffect, useRef, forwardRef } from 'react'
import type { Podcast } from 'main/store/types'
import { Link } from 'components/atoms'
import Background from './Background'
import Player from './Player'
import { useLocation, useEvent } from 'utils/hooks'
import { scrollTo } from 'utils/animate'
import { setUrl } from 'utils/url'
import {
  Container,
  TabWrap,
  TabContainer,
  ActiveTabLine,
  SectionWrap,
  Section,
} from './styles'

interface Props {
  podcast: Podcast
  episode: EpisodeMin
  slot?: string
}

export default function FullscreenContainer({
  podcast,
  episode,
  ...props
}: Props) {
  useLocation()
  const activeTab = hashes.indexOf(location.hash || '#playing')
  const [lastTab, setLastTab] = useState(-1)
  const [sectionRef, setSecRef] = useState<HTMLElement | null>()
  const lineRef = useRef<HTMLDivElement>(null)
  const [linkTransit, setLinkTransit] = useState(false)

  useEffect(() => {
    if (!sectionRef) return
    if (lastTab !== activeTab) setLastTab(activeTab)
    if (lastTab < 0) sectionRef.scrollLeft = activeTab * sectionRef.offsetWidth
  }, [activeTab, lastTab, sectionRef])

  function onSwipe(offset: number) {
    if (!lineRef.current) return
    lineRef.current.style.transform = getLineTransform(lineRef.current, offset)
    if (linkTransit || Math.round(offset) === activeTab) return
    setUrl({ hash: hashes[Math.round(offset)] })
  }

  function onTabClick() {
    const active = hashes.indexOf(location.hash)
    if (active < 0 || !sectionRef) return
    scrollTo(sectionRef, {
      left: active * sectionRef.offsetWidth,
      behavior: 'smooth',
    })
    setLinkTransit(true)
    setTimeout(() => {
      setLinkTransit(false)
    }, 500)
  }

  useEvent(
    sectionRef,
    'scroll',
    ({ currentTarget: { scrollLeft, offsetWidth } }) => {
      onSwipe(scrollLeft / offsetWidth)
    },
    { passive: true }
  )

  return (
    <Container {...props}>
      <Background podcast={podcast} />
      <TabWrap>
        <TabContainer onClick={onTabClick}>
          {tabs.map((title, i) => (
            <Tab key={title} active={activeTab === i}>
              {title}
            </Tab>
          ))}
        </TabContainer>
        <TabLine active={activeTab} ref={lineRef} />
      </TabWrap>
      <SectionWrap ref={setSecRef}>
        <Section />
        <Section>
          <Player podcast={podcast} episode={episode} />
        </Section>
        <Section />
      </SectionWrap>
    </Container>
  )
}

export const tabs = ['notes', 'now playing', 'queue']
const getHash = (title: string) => `#${title.split(' ').pop()?.toLowerCase()}`
export const hashes = tabs.map(getHash)

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

const TabLine = forwardRef<HTMLDivElement, { active: number }>(
  ({ active }, _ref) => {
    const [initial] = useState(active)
    const [ref, setRef] = useState<HTMLDivElement | null>(null)
    if (_ref) {
      if (typeof _ref === 'function') _ref(ref)
      else _ref.current = ref
    }

    useEffect(() => {
      if (!ref) return
      ref.style.transform = getLineTransform(ref, initial)
    }, [ref, initial])

    if (active < 0) return null
    return <ActiveTabLine ref={setRef} />
  }
)

function getLineTransform(ref: HTMLElement, n: number) {
  if (Number.isInteger(n)) {
    const [off, scale] = transformStep(ref, n)
    return `translateX(${off}px) scaleX(${scale})`
  }
  const [[o1, s1], [o2, s2]] = [Math.floor(n), Math.ceil(n)].map(i =>
    transformStep(ref, i)
  )
  return `translateX(${o1 + (o2 - o1) * (n % 1)}px) scaleX(${
    s1 + (s2 - s1) * (n % 1)
  })`
}

function transformStep(
  ref: HTMLElement,
  i: number
): [offset: number, scale: number] {
  const ul = ref.parentElement!.querySelector<HTMLUListElement>('ul')!
  const associate = (ul.children[i] as HTMLElement)
    .firstElementChild! as HTMLElement
  return [associate.offsetLeft - ul.offsetLeft, associate.offsetWidth / 100]
}
