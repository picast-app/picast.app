import React from 'react'
import styled from 'styled-components'
import { Icon, Slider } from 'components/atoms'
import { useStateX } from 'hooks'
import store from 'store/uiThread/api'

export function Volume() {
  const [volume] = useStateX('player.volume')
  const [muted] = useStateX('player.muted')

  return (
    <S.Container>
      <S.Inner tabIndex={0}>
        <Icon
          icon={muted || !volume ? 'speaker_off' : 'speaker'}
          label={muted ? 'unmute' : 'mute'}
          onClick={e => {
            ;(e.target as HTMLElement).closest<HTMLElement>(':focus')?.blur()
            if (muted && volume === 0) store.setX('player.volume', 0.5)
            store.setX('player.muted', !muted)
          }}
          ripple
        />
        {volume !== undefined && (
          <Slider
            value={muted ? 0 : volume}
            onChange={n => {
              store.setX('player.volume', n)
              if (muted) store.setX('player.muted', false)
            }}
            min={0}
            max={1}
            step={0.01}
          />
        )}
      </S.Inner>
    </S.Container>
  )
}

const S = {
  Container: styled.div`
    --icon-size: 1.3rem;
    --min-size: calc(var(--icon-size) + 1rem);

    z-index: 10;
    height: var(--min-size);
    width: var(--min-size);
    position: relative;
  `,

  Inner: styled.div`
    --width-expanded: calc(var(--sidebar-width) - 2 * var(--padd-side));
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--cl-surface-alt);
    transition: width 0.15s ease, height 0.15s ease;
    overflow: hidden;

    &:focus-within,
    &:hover {
      width: var(--width-expanded);
      height: var(--size);
    }

    &,
    & > * {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
    }

    input[type='range'] {
      margin: 0;
      --off-left: 0.3rem;
      --off-right: 1rem;
      left: calc(var(--min-size) + var(--off-left));
      width: calc(
        var(--width-expanded) - var(--min-size) - var(--off-left) -
          var(--off-right)
      );

      height: 0.25rem;

      &::-webkit-slider-thumb {
        transform: scale(0.8);
      }
    }
  `,
}
