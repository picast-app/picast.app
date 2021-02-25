import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import Section from './Section'
import { format } from 'utils/storage'
import { Button } from 'components/atoms'
import { mobile, desktop } from 'styles/responsive'

export default function Storage() {
  const [usage, setUsage] = useState<number>()
  const [available, setAvailable] = useState<number>()
  const [chartData, setChartData] = useState<Omit<ChartProps, 'total'>>()

  useEffect(() => {
    navigator.storage.estimate().then(res => {
      setUsage(res.usage)
      setAvailable(res.quota)
      if (!('usageDetails' in res)) return
      const { caches, indexedDB, serviceWorkerRegistrations } = (res as any)
        .usageDetails as Record<string, number>
      setChartData({ caches, idb: indexedDB, sw: serviceWorkerRegistrations })
    })
  }, [])

  return (
    <S.Page>
      <Section>
        <span>Used</span>
        <span>{format(usage)}</span>
        <span>Available</span>
        <span>{format(available)}</span>
      </Section>
      {chartData && <Chart total={usage!} {...chartData} />}
      <Button>clear all data</Button>
    </S.Page>
  )
}

type ChartProps = {
  total: number
  caches: number
  idb: number
  sw: number
}

function Chart({ total, ...props }: ChartProps) {
  let items: [name: string, size: number, key: string][] = [
    ['Cache', props.caches, 'caches'],
    ['IndexedDB', props.idb, 'idb'],
    ['Service Worker', props.sw, 'sw'],
  ]
  items = items.sort(([, a], [, b]) => b - a)

  const RAD = 40

  const arcSegs = items
    .map(
      ([, , k]) =>
        [k, ((props as any)[k] as number) / total] as [string, number]
    )
    .map(
      ([k, n], i, a) =>
        [
          k,
          n,
          a
            .map(([, v]) => v)
            .slice(0, i)
            .reduce((a, c) => a + c, 0),
        ] as [string, number, number]
    )
    .map(
      ([k, n, o]) =>
        [k, n, arcPos(o), arcPos(o + n + 0.001)] as [
          string,
          number,
          [number, number],
          [number, number]
        ]
    )

  return (
    <S.ChartWrap>
      <S.Chart viewBox="0 0 100 100">
        {arcSegs.map(([key, a, [x1, y1], [x2, y2]]) => (
          <path
            key={key}
            d={`M ${x1} ${y1} A ${RAD} ${RAD} 1 ${
              a > 0.5 ? 1 : 0
            } 0 ${x2} ${y2}`}
            stroke={`var(--cl-${key})`}
            strokeWidth="20"
            fill="none"
          />
        ))}
      </S.Chart>
      <S.ChartList>
        {items.map(([name, size, key]) => (
          <li key={key}>
            <span>{format(size)}</span>
            <S.ColorSquare style={{ backgroundColor: `var(--cl-${key})` }} />
            <span>{name}</span>
          </li>
        ))}
      </S.ChartList>
    </S.ChartWrap>
  )
}

const arcPos = (off: number, radius = 40, center = [50, 50]) => [
  center[0] + Math.sin(Math.PI + off * Math.PI * 2) * radius,
  center[1] + Math.cos(Math.PI + off * Math.PI * 2) * radius,
]

const S = {
  Page: styled.div`
    padding: calc((var(--nav-size) - 1rem) / 2);

    & > section {
      padding: 0;
    }
  `,

  ChartWrap: styled.div`
    margin: auto;
    display: flex;
    flex-direction: row;
    margin-bottom: 2rem;
    align-items: center;

    @media ${mobile} {
      flex-direction: column;
    }

    @media ${desktop} {
      margin: 3rem;
    }

    --cl-caches: #e64a19cc;
    --cl-idb: #512da8cc;
    --cl-sw: #fbc02dcc;
  `,

  ChartList: styled.ol`
    display: grid;
    grid-row-gap: 1rem;
    grid-column-gap: 2vmin;
    grid-template-columns: repeat(3, auto);
    grid-auto-rows: max-content;

    @media ${mobile} {
      margin-top: 2rem;
    }

    @media ${desktop} {
      margin-left: 5vw;
      flex-shrink: 0;

      span:not(:nth-of-type(2n)) {
        text-align: right;
      }
    }

    li {
      display: contents;
    }
  `,

  Chart: styled.svg`
    width: 10rem;
    height: 10rem;
  `,

  ColorSquare: styled.div`
    display: block;
    width: 1rem;
    height: 1rem;
  `,
}
