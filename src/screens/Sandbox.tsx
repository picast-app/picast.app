import React, { useState } from 'react'
import styled from 'styled-components'
import { Screen, Surface } from 'components/structure'
import { Slider } from 'components/atoms'
import { center } from 'styles/mixin'

export default function Sandbox() {
  const [el, setEl] = useState(0)

  return (
    <Screen>
      <SShadowDemo>
        <Surface sc={STile} el={el}>
          <span>{el}</span>
        </Surface>
        <Slider max={24} value={el} onChange={setEl} vertical />
      </SShadowDemo>
    </Screen>
  )
}

const STile = styled.div`
  width: 10rem;
  height: 10rem;
  border-radius: 1rem;
`

const SShadowDemo = styled.div`
  width: 100%;
  height: 80vh;
  position: relative;

  ${STile} {
    ${center}

    span {
      ${center}
      font-size: 2rem;
      color: var(--cl-text);
      opacity: 0.2;
    }
  }

  input {
    ${center}
    margin-left: 10rem;
  }
`
