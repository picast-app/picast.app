import React from 'react'
import styled from 'styled-components'

type Props =
  | { h1: true }
  | { h2: true }
  | { h3: true }
  | { h4: true }
  | { h5: true }
  | { h6: true }

export const Title: React.FC<Props> = ({ children, ...props }) => {
  const [size] = Object.entries(props).find(([k, v]) => v && /^h[0-6]$/.test(k))
  const Comp = S[size as keyof typeof S]
  return <Comp as={size}>{children}</Comp>
}

const Base = styled.span`
  font-size: 1rem;
  margin: 1em 0;
`

const S = {
  h1: styled(Base)`
    font-size: 2.82rem;
    font-weight: 300;
    letter-spacing: -0.09rem;
  `,

  h2: styled(Base)`
    font-size: 1.76rem;
    font-weight: 300;
    letter-spacing: -0.03rem;
  `,

  h3: styled(Base)`
    font-size: 1.41rem;
    font-weight: 400;
    letter-spacing: 0;
  `,

  h4: styled(Base)`
    font-size: 1rem;
    font-weight: 400;
    letter-spacing: 0.02rem;
  `,

  h5: styled(Base)`
    font-size: 0.71rem;
    font-weight: 400;
    letter-spacing: 0;
  `,

  h6: styled(Base)`
    font-size: 0.59rem;
    font-weight: 500;
    letter-spacing: 0.01rem;
  `,
}
