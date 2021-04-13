import React, { useState, useEffect, useRef, forwardRef } from 'react'
import type { Podcast } from 'main/store/types'
import { Link } from 'components/atoms'
import Background from './Background'
import Player from './Player'
import { Queue } from 'components/composite'
import { EpisodeInfo } from 'components/composite'
import { useLocation, useEvent } from 'utils/hooks'
import { scrollTo } from 'utils/animate'
import { setUrl } from 'utils/url'
import { memoize } from 'utils/cache'
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
  const [activeTab, setActiveTab] = useState(activeTabIndex)
  const [sectionRef, setSecRef] = useState<HTMLElement | null>()
  const lineRef = useRef<HTMLDivElement>(null)
  const linkTransit = useRef(false)
  const swipeRef = useRef<(n: number) => void>()
  const [isExtended, setExtended] = useState(activeTabIndex(false) >= 0)
  const wasExtended = useRef<boolean | null>(null)

  const _tab = activeTabIndex()
  useEffect(() => {
    setActiveTab(_tab)
  }, [_tab])

  useEffect(() => {
    if (!sectionRef) return
    if (isExtended === wasExtended.current) return
    sectionRef.scrollLeft = activeTab * sectionRef.offsetWidth
  }, [activeTab, sectionRef, isExtended])

  const _atab = activeTabIndex(false)
  useEffect(() => {
    setExtended(activeTabIndex(false) >= 0)
    wasExtended.current = wasExtended.current === null ? false : isExtended
  }, [isExtended, _atab])

  function onSwipe(offset: number) {
    if (!wasExtended.current && Number.isInteger(offset)) return
    wasExtended.current = true
    if (!lineRef.current) return
    lineRef.current.style.transform = getLineTransform(lineRef.current, offset)
    if (!linkTransit.current && Math.round(offset) !== activeTab)
      setActiveTab(Math.round(offset))
    if (Number.isInteger(offset) && offset !== activeTabIndex())
      setUrl({ hash: hashes[Math.round(offset)] })
  }
  swipeRef.current = onSwipe

  function onTabClick() {
    const active = hashes.indexOf(location.hash)
    if (active < 0 || !sectionRef) return
    scrollTo(sectionRef, {
      left: active * sectionRef.offsetWidth,
      behavior: 'smooth',
    })
    linkTransit.current = true
    setTimeout(() => {
      linkTransit.current = false
    }, 500)
  }

  useEvent(
    sectionRef,
    'scroll',
    ({ currentTarget: { scrollLeft, offsetWidth }, ...e }) => {
      swipeRef.current?.(scrollLeft / offsetWidth)
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
        <Section>
          {podcast && (
            <EpisodeInfo podcast={podcast} episode={episode as any} />
          )}
        </Section>
        <Section>
          <Player podcast={podcast} episode={episode} />
        </Section>
        <Section>
          <Queue />
        </Section>
      </SectionWrap>
    </Container>
  )
}

export const tabs = ['notes', 'now playing', 'queue']
const getHash = (title: string) => `#${title.split(' ').pop()?.toLowerCase()}`
export const hashes = tabs.map(getHash)
const activeTabIndex = (def: any = '#playing') =>
  hashes.indexOf(location.hash || def)

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

const transformStep = memoize(
  (ref: HTMLElement, i: number): [offset: number, scale: number] => {
    const ul = ref.parentElement!.querySelector<HTMLUListElement>('ul')!
    const associate = (ul.children[i] as HTMLElement)
      .firstElementChild! as HTMLElement
    return [associate.offsetLeft - ul.offsetLeft, associate.offsetWidth / 100]
  },
  (_, i) => window.innerWidth + i / 10
)
