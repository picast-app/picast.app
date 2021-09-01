import React from 'react'
import Section from './Section'
import { Button } from 'components/atoms'
import { store } from 'store'
import { createAppended, setAttributes } from 'utils/dom'
import { notNullish } from 'utils/array'

export default function General() {
  return (
    <Section title={$.c`general`}>
      <label>export OPML</label>
      <Button onClick={downloadOPML}>export</Button>
    </Section>
  )
}

async function createOPML() {
  const doc = document.implementation.createDocument(null, 'opml')
  doc.documentElement.setAttribute('version', '1.0')

  const head = createAppended('head', doc)
  createAppended('title', head).innerHTML = 'Picast Feeds'

  const body = createAppended('body', doc)
  const outline = createAppended('outline', body)
  outline.setAttribute('text', 'feeds')

  const subs = notNullish(
    await store.getJoined('user.subscriptions', 'podcasts.*')
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
