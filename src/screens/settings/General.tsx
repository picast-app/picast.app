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
      <Button onClick={exportOPML}>export</Button>
    </Section>
  )
}

async function exportOPML() {
  const opml = await createOPML()
  logger.info(new XMLSerializer().serializeToString(opml))
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
  subs.forEach(({ title, feed }) =>
    setAttributes(createAppended('outline', outline), {
      type: 'rss',
      text: title,
      xmlUrl: feed,
    })
  )

  return doc
}
