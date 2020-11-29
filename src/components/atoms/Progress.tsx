import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import * as cl from 'utils/css/color'

type Props = {
  active?: boolean
}

export const Progress = ({ active = true }: Props) => {
  const [visible, setVisible] = useState(active)

  useEffect(() => {
    if (active) setVisible(true)
    else setTimeout(() => setVisible(false), 500)
  }, [active])

  if (!visible) return null
  return <S.Bar data-collapsed={!active} />
}

const S = {
  Bar: styled.div`
    position: absolute;
    width: 100%;
    height: var(--progress-height);
    top: 0;
    left: 0;
    overflow-x: hidden;
    transition: transform 0.5s ease;
    background-color: ${() =>
      cl.format.hex(
        cl.blend(cl.read('background'), cl.alpha(cl.read('primary'), 0x66))
      )};

    &[data-collapsed='true'] {
      transform: scaleY(0);
    }

    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      will-change: left, right;
      background-color: var(--cl-primary);
    }

    &::before {
      animation: indeterminate 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395)
        infinite;
    }

    &::after {
      animation: indeterminate-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1)
        infinite;
      animation-delay: 1.15s;
    }

    @keyframes indeterminate {
      0% {
        left: -35%;
        right: 100%;
      }

      60% {
        left: 100%;
        right: -90%;
      }

      100% {
        left: 100%;
        right: -90%;
      }
    }

    @keyframes indeterminate-short {
      0% {
        left: -200%;
        right: 100%;
      }

      60% {
        left: 107%;
        right: -8%;
      }

      100% {
        left: 107%;
        right: -8%;
      }
    }
  `,
}

export const ProgressSC = S.Bar
