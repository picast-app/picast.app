import React from 'react'
import styled from 'styled-components'
import { useComputed } from 'utils/hooks'

type Props = {
  document: Document
}

function parse(node: Node, i?: number) {
  const children = Array.from(node.childNodes)
  let childContent = ''
  if (children.length === 1 && children[0].nodeName === '#text')
    childContent = children[0].textContent ?? ''
  const tag = (node as Element).tagName

  const head =
    node.nodeName === '#text'
      ? node.textContent
      : tag
      ? `<${tag}>`
      : node.nodeName

  const close = tag && <CloseTag>&lt;{tag}&gt;</CloseTag>

  if (childContent)
    return (
      <Node key={i}>
        {head}
        {childContent}
        {close}
      </Node>
    )
  return (
    <Node key={i}>
      {head}
      {children.length > 0 && <ol>{children.map(parse)}</ol>}
      {close}
    </Node>
  )
}

const Node: React.FC = ({ children }) => {
  const hasChildren = React.Children.toArray(children).some(
    v => (v as any).type === 'ol'
  )
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

  return (
    <S.Document>
      <S.Root
        onMouseOver={({ target }) =>
          (target as HTMLElement).toggleAttribute('data-hover')
        }
        onMouseOut={({ target }) =>
          (target as HTMLElement).toggleAttribute('data-hover')
        }
      >
        {pretty}
      </S.Root>
    </S.Document>
  )
}

const CloseTag = styled.span``

const S = {
  Document: styled.div`
    ol {
      padding-left: 1rem;
    }
  `,

  Root: styled.div`
    font-family: 'Menlo', 'Source Code Pro', monospace;
    font-size: 14px;
    line-height: 1.4em;
  `,

  Node: styled.li`
    &[data-hover] {
      background-color: #fff1;
    }

    &[aria-expanded='false']::marker {
      content: '▸ ';
    }

    &[aria-expanded='true']::marker {
      content: '▾ ';
    }

    &[aria-expanded='false'] > ol,
    &[aria-expanded='false'] > ${CloseTag} {
      display: none;
    }
  `,
}
