import React from 'react'
import styled from 'styled-components'
import { Screen, Surface } from 'components/structure'
import { Plot, Datum } from 'components/atoms'
import * as funcs from 'utils/ease'
import { useComputed } from 'utils/hooks'
import { desktop } from 'styles/responsive'

export default function Ease() {
  return (
    <Screen style={S.Page} padd>
      <S.Grid>
        {Object.keys(funcs).map(k => (
          <EaseFunc key={k} name={k as keyof typeof funcs} pts={600} />
        ))}
      </S.Grid>
    </Screen>
  )
}

function EaseFunc({
  name,
  pts = 10,
}: {
  name: keyof typeof funcs
  pts?: number
}) {
  const data = useComputed(pts, v =>
    Array(v)
      .fill(0)
      .map(
        (_, i, { length }) =>
          [i / (length - 1), funcs[name](i / (length - 1))] as Datum
      )
  )

  return (
    <Surface el={3} sc={S.Func}>
      <abbr title={funcs[name].toString()}>
        <h2>{name}</h2>
      </abbr>
      <Plot data={data} padd={0.05} scatter />
    </Surface>
  )
}

// prettier-ignore
const S = {
  Page: styled.div``,

  Grid: styled.div`
    display: grid;

    --width: 60rem;
    --max-width: 100vw;
    --gap: 2rem;
    --columns: 3;

    width: var(--width);
    max-width: 100%;
    margin: auto;
    grid-template-columns: repeat(var(--columns), 1fr);
    grid-gap: var(--gap);

    @media (max-width: 600px) {
      --columns: 1;
    }

    @media ${desktop} {
      --max-width: calc(100vw - var(--sidebar-width));
    }
  `,

  Func: styled.div`
    height: calc((min(var(--width), var(--max-width)) - (var(--columns) - 1) * var(--gap)) / var(--columns));
    padding: 1rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;

    abbr {
      text-align: center;
      text-decoration: none;
      margin-bottom: 1rem;
    }
  `,
}
