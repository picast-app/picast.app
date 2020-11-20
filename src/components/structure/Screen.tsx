import React from 'react'
import styled, { AnyStyledComponent } from 'styled-components'
import { desktop } from 'styles/responsive'
import Appbar, { AppbarSC } from 'components/Appbar'
import { Progress, ProgressSC } from 'components/atoms'

type Props = {
  style?: AnyStyledComponent
  padd?: boolean
  loading?: boolean
}

export const Screen: React.FC<Props> = ({
  style,
  padd,
  loading = false,
  ...props
}) => {
  const progress = <Progress active={loading} />

  const children = React.Children.toArray(props.children)

  const cloneBar = () => {
    const bar: any = children.splice(0, 1)[0]
    return React.cloneElement(bar, bar.props, bar.props.children, progress)
  }

  const appbar =
    typeof children[0] === 'object' &&
    ((children[0] as unknown) as React.ReactElement).type === Appbar
      ? cloneBar()
      : React.Fragment

  return (
    <S.Screen
      offsetTop={appbar !== React.Fragment ? 'var(--bar-height)' : '0px'}
      as={style}
      padd={padd}
    >
      {progress}
      {appbar}
      {children}
    </S.Screen>
  )
}

// prettier-ignore
const S = {
  Screen: styled.div<{ offsetTop: string; padd?: boolean }>`
    --top-off: ${({offsetTop}) => offsetTop};
    --padd: ${({padd}) => padd ? '1rem' : '0px'};
  
    padding: var(--padd);
    padding-top: calc(var(--padd) + var(--top-off));
    height: calc(100% - var(--bar-height));
    overflow-y: auto;
    position: relative;

    &::-webkit-scrollbar {
      display: none;
    }

    @media ${desktop} {
      height: 100%;
      flex-grow: 1;
      --top-off: 0px;
    }

    & > ${ProgressSC} {
      position: fixed;
    }

    /* stylelint-disable-next-line */
    & > *:first-child,
    ${AppbarSC.Bar} + *,
    ${AppbarSC.Wrap} + *,
    ${ProgressSC} + * {
      margin-top: 0;
    }

    section:not(:first-of-type) {
      margin-top: 2rem;
      border-top: 1px solid var(--cl-text-disabled);
    }
  `,
}
