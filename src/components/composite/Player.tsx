import React, { useState } from 'react'
import styled from 'styled-components'
import { Surface } from 'components/structure'
import { bar } from 'styles/mixin'
import { desktop } from 'styles/responsive'

export function Player() {
  const [src, setSrc] = useState<string>()

  if (!src) return null
  return (
    <Surface sc={S.Player} el={4}>
      <S.PlayControls></S.PlayControls>
    </Surface>
  )
}

const S = {
  Player: styled.div`
    ${bar}
    display: block;
    bottom: var(--bar-height);
    height: var(--player-height);
    z-index: 9000;

    @media ${desktop} {
      bottom: 0;
    }
  `,

  PlayControls: styled.div`
    border: 1px dotted #f00;

    @media ${desktop} {
      position: absolute;
      width: var(--sidebar-width);
      height: 100%;
      transform: translateX(-100%);
    }
  `,
}

export const PlayerSC = S.Player
