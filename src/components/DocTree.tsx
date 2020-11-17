import React from 'react'
import styled from 'styled-components'
import { useComputed } from 'utils/hooks'

type Props = {
  document: Document
}

function parse(node: Node, i?: number) {
  const children = Array.from(node.childNodes).map(parse)
  return (
    <Node key={i}>
      {node.nodeName}
      {children.length > 0 && <ol>{children}</ol>}
    </Node>
  )
}

const Node: React.FC = ({ children }) => {
  const hasChildren =
    (React.Children.toArray(children).slice(-1)[0] as any)?.type === 'ol'
  return (
    <S.Node
      role="treeitem"
      {...(hasChildren && {
        onClick(e) {
          e.stopPropagation()
          const node = e.target as HTMLElement
          if (node !== e.currentTarget) return
          node.setAttribute(
            'aria-expanded',
            node.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'
          )
        },
        'aria-expanded': false,
      })}
    >
      {children}
    </S.Node>
  )
}

export default function DocTree({ document }: Props) {
  console.log(document)
  ;(window as any).doc = document

  const pretty = useComputed(document, parse)

  return <S.Document>{pretty}</S.Document>
}

const S = {
  Document: styled.div`
    ol {
      padding-left: 1rem;
    }
  `,

  Node: styled.li`
    &[data-hover] {
      background-color: #fff1;
    }

    &[aria-expanded='false'] {
      &::before {
        content: '> ';
      }

      & > ol {
        display: none;
      }
    }

    &[aria-expanded='true']::before {
      content: 'x ';
    }
  `,
}
