import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import {
  useCallbackRef,
  useDependent,
  useMany,
  useValueRef,
  useJoinedX,
} from 'hooks'
import * as notify from 'utils/notification'
import { mapValues } from 'utils/object'
import { notNullish } from 'utils/array'
import { Checkbox, CheckList } from 'components/atoms'
import { Dialog } from 'components/structure'
import { main } from 'workers'
import type * as GQL from 'types/gql'
import type { Key as StrKey } from 'i18n/strings'
import * as predicate from 'utils/predicate'
import { Podcast } from 'store/state'
import { useLocation, history } from '@picast-app/router'

export function Import() {
  const [open, setOpen] = useState(false)
  const [ref, items] = useImport()

  useEffect(() => {
    if (items) setOpen(true)
  }, [items])

  return (
    <>
      <input type="file" accept="text/xml" ref={ref} />
      <Dialog open={open} onClose={() => setOpen(false)} rescale>
        <Modal items={items ?? []} />
      </Dialog>
    </>
  )
}

function Modal({ items }: { items: OPMLItem[] }) {
  const subscriptions = useJoinedX('user.subscriptions', 'podcasts.*')
  const feeds = useFeeds(items.map(({ xmlUrl }) => xmlUrl))
  const [add, setAdd] = useState<string[]>([])
  const [remove, setRemove] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  logger.info({ add, remove })

  return (
    <S.Modal>
      <Add
        items={items}
        subs={subscriptions?.filter(predicate.notNullish).map(v => v.id) ?? []}
        feeds={feeds}
        setAdd={setAdd}
        setLoading={setLoading}
      />
      <List
        title="@settings.imp_dup"
        items={items.filter(
          ({ xmlUrl }) => feeds[xmlUrl] && add.includes(feeds[xmlUrl]!.id)
        )}
      />
      <List
        title="@settings.imp_miss"
        items={items.filter(({ xmlUrl }) => feeds[xmlUrl] === null)}
      />
      {!loading && (
        <Remove
          subs={notNullish(subscriptions ?? [])}
          imported={Object.values(feeds)
            .filter(predicate.notNullish)
            .map(({ id }) => id)}
          setRemove={setRemove}
        />
      )}
    </S.Modal>
  )
}

const List: React.FC<{ title: StrKey; items: OPMLItem[] }> = ({
  title,
  items,
}) =>
  !items?.length ? null : (
    <details>
      <summary>{$(title, $.count('podcast', items.length))}</summary>
      <ul>
        {items.map(({ xmlUrl, text }) => (
          <li key={xmlUrl}>{text}</li>
        ))}
      </ul>
    </details>
  )

const Add: React.FC<{
  items: OPMLItem[]
  subs: string[]
  feeds: Record<string, GQL.ImportSearch_searchByFeed | null>
  setAdd(v: string[]): void
  setLoading(v: boolean): void
}> = ({ items, subs, feeds, setAdd, setLoading }) => {
  const [doAdd, setDoAdd] = useState(true)

  const [loading, newItems] = useMany(
    (items, known) => [
      items.flatMap(({ xmlUrl }, i) => (xmlUrl in known ? [] : [i])),
      items
        .filter(
          ({ xmlUrl }) =>
            !(xmlUrl in known) ||
            (known[xmlUrl] && !subs.includes(known[xmlUrl]!))
        )
        .sort((a, b) => a.text.localeCompare(b.text)),
    ],
    items,
    mapValues(feeds, v => v?.id ?? null)
  )
  const [add, setAddInds] = useDependent(newItems, ({ length }) =>
    Array<boolean>(length).fill(true)
  )
  const selection = useMany(
    (sel, ids) => sel.map((v, i) => v && ids[i]).filter(predicate.truthy),
    add,
    subs
  )
  useEffect(() => setAdd(selection), [setAdd, selection])
  useEffect(() => setLoading(loading.length > 0), [setLoading, loading.length])

  if (add.length === 0) return <span>no new podcasts in import</span>
  return (
    <details open>
      <S.Action>
        <span>
          {$(
            '@settings.imp_add',
            $.count('podcast', doAdd && add.filter(Boolean).length)
          )}
        </span>
        <Checkbox checked={doAdd} onChange={setDoAdd} />
      </S.Action>
      <CheckList
        active={doAdd ? add : []}
        loading={loading}
        onChange={setAddInds}
        disabled={!doAdd}
      >
        {newItems.map(({ text, xmlUrl }) => (
          <span key={xmlUrl}>{text}</span>
        ))}
      </CheckList>
    </details>
  )
}

const Remove: React.FC<{
  subs: Podcast[]
  imported: string[]
  setRemove(v: string[]): void
}> = ({ subs, imported, setRemove }) => {
  const [doRemove, setDoRemove] = useState(false)
  const removable = useMany(
    (pods, known) =>
      pods
        .filter(id => !known.includes(id))
        .map(id => subs.find(v => v!.id === id)!)
        .sort(({ title: a }, { title: b }) => a.localeCompare(b)),
    subs.map(({ id }) => id),
    imported
  )
  const [remove, setRemoveInds] = useDependent(removable, ({ length }) =>
    Array<boolean>(length).fill(false)
  )
  const selection = useMany(
    (sel, ids) => sel.map((v, i) => v && ids[i]).filter(predicate.truthy),
    remove,
    subs.map(({ id }) => id)
  )
  useEffect(() => setRemove(selection), [selection, setRemove])

  if (!remove.length) return null
  return (
    <details>
      <S.Action>
        <span>
          {$(
            '@settings.imp_del',
            $.count('podcast', doRemove && selection.length)
          )}
        </span>
        <Checkbox checked={doRemove} onChange={setDoRemove} />
      </S.Action>
      <CheckList
        active={doRemove ? remove : []}
        onChange={setRemoveInds}
        disabled={!doRemove}
      >
        {removable.map(({ id, title }) => (
          <span key={id}>{title}</span>
        ))}
      </CheckList>
    </details>
  )
}

function useFeeds(feeds: string[]) {
  const [dict, setDict] = useState<
    Record<string, GQL.ImportSearch_searchByFeed | null>
  >({})

  const known = useValueRef({ dict, queue: Array<string>() })
  const fetching = useRef(false)

  useEffect(() => {
    const fetchFeeds = async () => {
      fetching.current = true

      const feeds = [...known.current.queue]
      const result = await main.importSearch(feeds)

      known.current.queue = known.current.queue.filter(
        url => !feeds.includes(url)
      )

      setDict(dict => ({
        ...dict,
        ...Object.fromEntries(
          feeds.map(url => [
            url,
            result.find(({ feed }) => feed === url) ?? dict[url] ?? null,
          ])
        ),
      }))

      if (!known.current.queue.length) fetching.current = false
      else await fetchFeeds()
    }

    const newFeeds = feeds.filter(
      url => !(url in known.current.dict) && !known.current.queue.includes(url)
    )
    if (!newFeeds.length) return

    known.current.queue.push(...newFeeds)
    if (!fetching.current) fetchFeeds()
  }, [feeds, known])

  return dict
}

type OPMLItem = { text: string; xmlUrl: string }

export const useImport = () => {
  const [items, setItems] = useState<OPMLItem[] | null>(null)
  const [text, setText] = useState<string>()

  const loc = useLocation()
  const query = new URLSearchParams(loc.search).get('opml')
  useEffect(() => {
    if (!query) return
    setText(query)
    history.push(location.pathname)
  }, [query])

  useEffect(() => {
    if (!text) return setItems(null)

    const doc = new DOMParser().parseFromString(text, 'text/xml')

    if (!doc.querySelector('outline[xmlUrl]')) return logInvalidType()

    setItems(
      [...doc.querySelectorAll('outline[xmlUrl]')].map(
        v =>
          Object.fromEntries(
            ['text', 'xmlUrl'].map(k => [k, v.getAttribute(k)])
          ) as any
      )
    )
  }, [text])

  const ref = useCallbackRef(input => {
    const reader = new FileReader()
    let file: File

    reader.addEventListener('load', e => {
      setText(e.target!.result as string)
    })

    function onChange({ target }: Event) {
      file = (target as HTMLInputElement).files![0]
      if (!file) return setItems(null)
      reader.readAsText(file)
    }

    input.addEventListener('change', onChange)

    return () => {
      input.removeEventListener('change', onChange)
    }
  })

  return [ref, items] as const
}

function logInvalidType(file = 'This', err?: unknown) {
  if (err) logger.error(err)
  notify.snack({
    lvl: 'error',
    text: `${file} is not a valid OPML file.`,
  })
}

const S = {
  Modal: styled.div`
    width: 35rem;
    max-width: calc(100vw - 2rem);

    ul {
      max-height: 30vh;
      overflow-y: scroll;
      padding: 1rem 0;
    }

    & > * + :is(details, span) {
      display: block;
      margin-top: 1rem;
    }
  `,

  Action: styled.summary`
    input {
      float: right;
    }
  `,
}
