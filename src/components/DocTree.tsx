import React, { useRef } from 'react'
import styled from 'styled-components'
import { useComputed, useNavbarWidget } from 'utils/hooks'

type Props = {
  document: Document
}

function parse(node: Node, i?: number) {
  const children = Array.from(node.childNodes)
  let childContent = ''
  if (children.length === 1 && children[0].nodeName === '#text')
    childContent = children[0].textContent ?? ''
  const tag = (node as Element).tagName

  if (node.nodeName === '#comment')
    return (
      <Node key={i}>
        <Comment>{node.textContent}</Comment>
      </Node>
    )

  const head =
    node.nodeName === '#text' || node.nodeName === '#cdata-section' ? (
      node.textContent
    ) : tag ? (
      <Tag>
        &lt;{tag}
        {Object.values((node as Element).attributes)?.map(at => {
          const v =
            typeof at.value !== 'string' ? undefined : (
              <AttrValue>{at.value}</AttrValue>
            )
          return (
            <Attr key={`${i}=${at.nodeName}`}>
              {at.nodeName}
              {v ? '=' : ''}
              {v}
            </Attr>
          )
        })}
        &gt;
      </Tag>
    ) : (
      node.nodeName
    )

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
    <Node
      key={i}
      expanded={i === undefined || ['rss', 'channel'].includes(tag)}
    >
      {head}
      {children.length > 0 && tag && (
        <CollapsedClose>/&lt;{tag}&gt;</CollapsedClose>
      )}
      {children.length > 0 && <ol>{children.map(parse)}</ol>}
      {close}
    </Node>
  )
}

const Node: React.FC<{ expanded?: boolean }> = ({
  children,
  expanded = false,
}) => {
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
        'aria-expanded': expanded,
      })}
    >
      {children}
    </S.Node>
  )
}

export default function DocTree({ document }: Props) {
  const global = window as any
  global.doc = document
  const ref = useRef<HTMLDivElement>(null)

  useNavbarWidget(
    <S.Controls key="xml-controls">
      <button
        onClick={() => {
          if (!ref.current) return
          ref.current
            .querySelectorAll('[aria-expanded]')
            .forEach(el => el.setAttribute('aria-expanded', 'true'))
        }}
      >
        expand all
      </button>
      <button
        onClick={() => {
          if (!ref.current) return
          Array.from(ref.current.querySelectorAll('[aria-expanded]'))
            .filter(v => v.parentElement !== ref.current)
            .forEach(el => el.setAttribute('aria-expanded', 'false'))
        }}
      >
        collapse all
      </button>
    </S.Controls>
  )

  const pretty = useComputed(document, parse)

  return (
    <S.Document>
      <S.Root
        ref={ref}
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
`

const CloseTag = styled(Tag)``

const CollapsedClose = styled(Tag)`
  &::before {
    content: '…';
    color: var(--cl-text);
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

const Attr = styled.span`
  color: #9bbbdc;

  &::before {
    content: ' ';
  }
`

const AttrValue = styled.span`
  color: #f29766;
  overflow-wrap: break-word;

  &::before {
    content: '"';
  }

  &::after {
    content: '"';
  }
`

const S = {
  Document: styled.div`
    ol {
      padding-left: 1rem;
    }
  `,

  Root: styled.div`
    font-family: 'Menlo', monospace;
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

    html[data-theme='light'] &[data-hover] {
      background-color: #00000008;
    }

    &[aria-expanded='false'] {
      cursor: ns-resize;
    }

    &[aria-expanded='false']::marker {
      content: '▸ ';
    }

    &[aria-expanded='true']::marker {
      content: '▾ ';
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

    &[aria-expanded='false'] > ol,
    &[aria-expanded='false'] > ${CloseTag} {
      display: none;
    }

    &[aria-expanded='true'] > ${CollapsedClose} {
      display: none;
    }
  `,

  Controls: styled.div`
    display: block;
    width: 100%;
    height: 5rem;
    border: 1px dotted #f00;
  `,
}
