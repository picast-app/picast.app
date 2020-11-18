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

  if (node.nodeName === '#comment') return <Comment>{node.textContent}</Comment>

  const head =
    node.nodeName === '#text' ? (
      node.textContent
    ) : tag ? (
      <Tag>{tag}</Tag>
    ) : (
      node.nodeName
    )

  const close = tag && <CloseTag>{tag}</CloseTag>

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

const Tag = styled.span`
  color: #2882f9;
  pointer-events: none;

  &::before {
    content: '<';
  }

  &::after {
    content: '>';
  }
`

const CloseTag = styled(Tag)`
  &::before {
    content: '</';
  }
`

const Comment = styled.span`
  opacity: 0.5;

  &::before {
    content: '<!--';
  }

  &::after {
    content: '-->';
  }
`

const S = {
  Document: styled.div`
    ol {
      padding-left: 1rem;
    }
  `,

  Root: styled.div`
    font-family: 'Menlo', 'Source Code Pro', monospace;
    font-size: 12px;
    line-height: 1.5em;

    & > li[aria-expanded='true']::before {
      content: none;
    }
  `,

  Node: styled.li`
    position: relative;

    &[data-hover] {
      background-color: #ffffff08;
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

    &[aria-expanded='true']::before {
      content: '';
      position: absolute;
      left: calc(-1em + 1px);
      top: 1.5em;
      width: 1px;
      height: calc(100% - 1.5em);
      background-color: var(--cl-text);
      opacity: 0.05;
    }

    &[aria-expanded='true']:hover::before {
      opacity: 0.1;
    }
  `,
}
