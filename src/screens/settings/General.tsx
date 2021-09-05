import React, { useState } from 'react'
import styled from 'styled-components'
import Section from './Section'
import { Button, Dropzone } from 'components/atoms'
import { store } from 'store'
import { createAppended, setAttributes } from 'utils/dom'
import { notNullish } from 'utils/array'
import { Import } from './Import'
import { sc } from 'utils/react'

export default function General() {
  const [file, setFile] = useState<File>()

  return (
    <Section title={$.c`general`}>
      <InOutWrap>
        <label>export OPML</label>
        <Button onClick={downloadOPML}>export</Button>
        <label>import OPML</label>
        <Dropzone for="in-import" onDrop={setFile}></Dropzone>
        <Import file={file} />
      </InOutWrap>
    </Section>
  )
}

const InOutWrap = styled.div`
  display: contents;

  & > button {
    justify-self: right;
  }

  & > label {
    height: var(--row-height);
    line-height: var(--row-height);
  }

  ${sc(Dropzone)} {
    grid-column: 1/3;
    grid-row: span 2;
    height: 100%;
    align-self: start;

    & + input[type='file'] {
      display: none;
    }
  }
`

async function createOPML() {
  const doc = document.implementation.createDocument(null, 'opml')
  doc.documentElement.setAttribute('version', '1.0')

  const head = createAppended('head', doc)
  createAppended('title', head).innerHTML = 'Picast Feeds'

  const body = createAppended('body', doc)
  const outline = createAppended('outline', body)
  outline.setAttribute('text', 'feeds')

  const subs = notNullish(
    await store.get('user.subscriptions').join('podcasts.*')
  )
  subs
    .sort(({ title: a }, { title: b }) => a.localeCompare(b))
    .forEach(({ title, feed }) =>
      setAttributes(createAppended('outline', outline), {
        type: 'rss',
        text: title,
        xmlUrl: feed,
      })
    )

  return doc
}

async function downloadOPML() {
  const link = document.createElement('a')
  link.setAttribute(
    'href',
    `data:text/plain;charset=utf-8,${encodeURIComponent(
      new XMLSerializer().serializeToString(await createOPML())
    )}`
  )
  link.setAttribute('download', 'picast_feeds.xml')
  logger.info(link)
  link.click()
}
