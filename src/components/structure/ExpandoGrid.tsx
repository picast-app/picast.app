import React from 'react'
import styled from 'styled-components'

type Props = {
  expanded?: boolean
  list?: boolean
}

export const ExpandoGrid: React.FC<Props> = ({
  expanded = false,
  list = false,
  ...props
}) => {
  const children = React.Children.toArray(props.children)
  return (
    <S.RowWrap data-mode={list ? 'list' : 'grid'}>
      <S.Results aria-expanded={expanded ? 'true' : 'false'}>
        {children.map((child, i) => (
          <S.Item key={(child as any).key}>{child}</S.Item>
        ))}
      </S.Results>
      {Array(10)
        .fill(0)
        .map((_, i) => (
          <S.ScrollStop key={`stop-${i}`} />
        ))}
    </S.RowWrap>
  )
}

const maxCardSize = 250
const padding = 1.5 * 16
const maxColumns = 18
const sideBarWidth = 15 * 16

const maxWidth = (columns: number) =>
  columns * maxCardSize + (columns - 1) * padding + 2 * padding + sideBarWidth

const breakPoints = Array(10)
  .fill(2)
  .map((v, i) => v + i)
  .map(
    columns =>
      `@media (min-width: ${maxWidth(
        columns - 1
      )}px) { --columns: ${columns}; }`
  )

const S = {
  RowWrap: styled.div`
    --columns: 1;
    --spacing: var(--padding);
    --max: ${maxColumns};

    position: relative;
    user-select: none;
    ${breakPoints.join('\n')}

    &[data-mode='grid'] {
      margin: 0 calc(var(--padding) * -1);
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x mandatory;

      &::-webkit-scrollbar {
        display: none;
      }
    }
  `,

  // prettier-ignore
  Results: styled.ol`
    *[data-mode='grid'] > & {
      display: grid;
      grid-gap: var(--spacing);
      grid-template-columns: repeat(
        var(--max),
        calc(
          (100vw - var(--sidebar-width) - var(--padding) * 2 - (var(--columns) - 1) * var(--spacing)) / var(--columns)
        )
      );
      padding-left: var(--padding);

      &[aria-expanded='true'] {
        --max: var(--columns);
      }

      &[aria-expanded='false'] > *:nth-child(n+${maxColumns + 1}) {
        display: none;
      }

      &[aria-expanded='false'] > *:nth-child(${maxColumns})::after {
        content: '';
        position: absolute;
        width: var(--padding);
        height: 100%;
        left: 100%;
        top: 0;
      }
    }
  `,

  ScrollStop: styled.div`
    display: block;
    flex-shrink: 0;
    width: 100%;
    height: 0;
    scroll-snap-align: end;
    position: absolute;

    --page: 0;

    left: calc(var(--page) * (100% - var(--padding)));
    ${Array(10)
      .fill(2)
      .map((v, i) => v + i)
      .map(i => `&:nth-of-type(${i}) { --page: ${i - 1}; }`)
      .join('\n')}
  `,

  Item: styled.li`
    position: relative;
  `,
}

export const ExpandoSC = S.RowWrap
