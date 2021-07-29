import React from 'react'
import styled from 'styled-components'

type Props = {
  min?: number
  max?: number
  value: number
  onChange(v: number): void
  vertical?: boolean
  step?: number
}

export const Slider: React.FC<Props> = ({
  min = 0,
  max = 100,
  value,
  onChange,
  vertical,
  step,
}: Props) => (
  <S.Slider
    type="range"
    min={min}
    max={max}
    step={step}
    value={value}
    onChange={({ target }) => {
      onChange(parseFloat(target.value))
    }}
    {...(vertical && { orient: 'vertical' })}
  />
)

const S = {
  Slider: styled.input<{ orient?: 'vertical' }>`
    height: 1rem;

    &[orient='vertical'] {
      appearance: slider-vertical;
      width: 1rem;
      height: unset;
    }

    &:not(:active)::-webkit-slider-runnable-track {
      cursor: pointer;
    }
    &:not(:active)::-webkit-slider-thumb {
      cursor: grab;
    }
    &:active {
      cursor: grabbing;
    }
  `,
}
