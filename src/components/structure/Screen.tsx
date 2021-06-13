import React, { useEffect, useState, useRef } from 'react'
import styled, { AnyStyledComponent } from 'styled-components'
import { desktop, mobile } from 'styles/responsive'
import Appbar, { AppbarSC } from 'components/Appbar'
import { Progress, ProgressSC, Icon } from 'components/atoms'
import { animateTo } from 'utils/animate'

type Props = {
  style?: AnyStyledComponent
  padd?: boolean
  loading?: boolean
  refreshAction?: () => void
}

const LOADER_DELAY = 20

export const Screen: React.FC<Props> = ({
  style,
  padd,
  loading = false,
  refreshAction,
  ...props
}) => {
  const [el, setEl] = useState<HTMLElement | null>(null)
  usePullEffect(el, refreshAction)
  const [showLoad, setShowLoad] = useState(false)
  const loadToId = useRef<number>()

  useEffect(() => {
    clearTimeout(loadToId.current!)
    if (!loading) {
      setShowLoad(false)
      return
    }
    loadToId.current = window.setTimeout(() => {
      setShowLoad(true)
    }, LOADER_DELAY)
  }, [loading])

  const progress = <Progress active={showLoad} />

  const children = React.Children.toArray(props.children)

  const cloneBar = () => {
    const bar: any = children.splice(0, 1)[0]
    return React.cloneElement(bar, bar.props, bar.props.children, progress)
  }

  const appbar =
    typeof children[0] === 'object' &&
    (children[0] as unknown as React.ReactElement).type === Appbar
      ? cloneBar()
      : React.Fragment

  return (
    <S.Screen
      offsetTop={appbar !== React.Fragment ? 'var(--appbar-height)' : '0px'}
      as={style}
      padd={padd}
      ref={setEl}
    >
      {progress}
      {appbar}
      <S.Content>
        {children}
        <S.Refresher>
          <Icon icon="arrow" />
        </S.Refresher>
      </S.Content>
    </S.Screen>
  )
}

function usePullEffect(node: HTMLElement | null, action?: () => void) {
  useEffect(() => {
    if (!node || !action) return
    const content = node.querySelector<HTMLElement>(
      `:scope > *:not(.${AppbarSC.Wrap.styledComponentId})`
    )!

    let startY: number
    let lastOff = 0
    const actionOff = 200

    let cancelled = false

    const onTouchEnd = async () => {
      await new Promise(res => setTimeout(res, 100))
      if (cancelled) return

      if (lastOff > actionOff && content.scrollTop === 0) action()
      lastOff = 0
      delete content.dataset.action
      node.removeEventListener('touchmove', onDrag)
      animateTo(
        content,
        { transform: 'translateY(0)' },
        { easing: 'ease', duration: 200 }
      )
    }

    const onTouch = ({ touches: [{ screenY }] }: TouchEvent) => {
      startY = screenY
      node.addEventListener('touchmove', onDrag, { passive: true })
      node.addEventListener('touchend', onTouchEnd, { once: true })
    }

    const onDrag = ({ touches: [{ screenY }] }: TouchEvent) => {
      let off = screenY - startY
      if (node.scrollTop > 0) {
        off = 0
        startY = screenY
      }
      if (lastOff > actionOff !== off > actionOff)
        content.dataset.action = off > actionOff ? 'refresh' : 'none'
      lastOff = off
      if (off <= 0 || content.scrollTop > 0)
        return (content.style.transform = '')
      content.style.transform = `translateY(${(off ** 0.75) | 0}px)`
    }

    node.addEventListener('touchstart', onTouch)

    return () => {
      cancelled = true
      node.removeEventListener('touchend', onTouchEnd)
      node.removeEventListener('touchstart', onTouch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node])
}

const S = {
  Screen: styled.div<{ offsetTop: string; padd?: boolean }>`
    --top-off: ${({ offsetTop }) => offsetTop};
    --padd: ${({ padd }) => (padd ? '1rem' : '0px')};

    padding: var(--padd);
    padding-top: calc(var(--padd) + var(--top-off));
    height: calc(100% - var(--bar-height));
    overflow-y: auto;
    position: relative;

    @media ${mobile} {
      &::-webkit-scrollbar {
        display: none;
      }
    }

    @media ${desktop} {
      height: 100%;
      flex-grow: 1;
      --top-off: 0px;
    }

    picast-player:not([hidden]) ~ & {
      height: calc(100% - var(--bar-height) - var(--player-height));

      @media ${desktop} {
        height: calc(100% - var(--player-height));
      }
    }

    & > ${ProgressSC} {
      position: fixed;
    }

    section:not(:first-of-type) {
      margin-top: 2rem;
      border-top: 1px solid var(--cl-text-disabled);
    }
  `,

  Content: styled.div`
    height: 100%;
  `,

  Refresher: styled.div`
    position: absolute;
    top: -1rem;
    left: 50%;
    transform: translateX(-50%) translateY(-100%);

    svg {
      opacity: 0.5;
      transition: transform 0.2s ease;
      transform: scale(0.9);

      [data-action='refresh'] & {
        transform: scale(0.9) rotate(180deg);
      }
    }
  `,
}
