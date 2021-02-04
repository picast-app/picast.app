import React from 'react'
import styled from 'styled-components'
import { desktop } from 'styles/responsive'

type Props = {
  title?: string
}

const Section: React.FC<Props> = ({ title, children }) => {
  return (
    <S.Section data-style={title ? 'title' : 'anom'}>
      {title && <S.Title>{title}</S.Title>}
      <S.Content>{children}</S.Content>
    </S.Section>
  )
}
export default Section

const S = {
  Section: styled.section`
    padding: calc((var(--nav-size) - 1rem) / 2);
    user-select: none;
    color: var(--cl-text-strong);
    --row-height: 3rem;
  `,

  Title: styled.h2`
    text-transform: uppercase;
    font-weight: 500;
    font-size: 0.8rem;
    letter-spacing: 0.04rem;
    color: var(--cl-text-strong);
    opacity: 0.7;
    height: var(--row-height);
    line-height: var(--row-height);

    @media ${desktop} {
      font-size: 0.95rem;
      height: unset;
      line-height: unset;
      margin-bottom: 1.5rem;
    }
  `,

  Content: styled.div`
    display: grid;
    grid-template-columns: 1fr auto;

    grid-auto-rows: var(--row-height);
    align-items: center;

    & > *:nth-child(2n) {
      user-select: text;
      justify-self: right;
    }

    & > span:nth-child(2n) {
      width: 100%;
      text-align: right;
    }

    & > label,
    & > span {
      height: var(--row-height);
      line-height: var(--row-height);
    }

    & > * {
      &:not(:nth-last-child(2)):not(:last-child) {
        border-bottom: 1px solid var(--cl-border-light);
      }
    }
  `,
}
