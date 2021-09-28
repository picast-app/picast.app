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
import { Checkbox, CheckList, Button, Spinner } from 'components/atoms'
import { Dialog } from 'components/structure'
import { main } from 'workers'
import type * as GQL from 'types/gql'
import type { Key as StrKey } from 'i18n/strings'
import * as predicate from 'snatchblock/predicate'
import { Podcast } from 'store/state'
import { useLocation, history } from '@picast-app/router'

export function Import({ file }: { file?: File }) {
  const [open, setOpen] = useState(false)
  const [ref, items] = useImport(file)

  useEffect(() => {
    if (items) setOpen(true)
  }, [items])

  return (
    <>
      <input type="file" accept="text/xml" ref={ref} id="in-import" />
      <Dialog open={open} onClose={() => setOpen(false)} rescale>
        <Modal items={items ?? []} onClose={() => setOpen(false)} />
      </Dialog>
    </>
  )
}

function Modal({ items, onClose }: { items: OPMLItem[]; onClose(): void }) {
  const subscriptions = useJoinedX('user.subscriptions', 'podcasts.*')
  const feeds = useFeeds(items.map(({ xmlUrl }) => xmlUrl))
  const [add, setAdd] = useState<string[]>([])
  const [remove, setRemove] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)

  async function submit(e: any) {
    e.preventDefault()
    logger.info({ add, remove })
    setImporting(true)
    const res = await Promise.allSettled([
      ...add.map(id => main.subscribe(id)),
      ...remove.map(id => main.unsubscribe(id)),
    ])
    res.filter(predicate.isRejected).forEach(v => logger.error(v.reason))
    setImporting(false)
    onClose()
  }

  const subIds =
    subscriptions?.map(v => v?.id).filter(predicate.notNullish) ?? []

  return (
    <S.Modal onSubmit={submit} onReset={onClose}>
      <Add
        items={items}
        subs={subIds}
        feeds={feeds}
        setAdd={setAdd}
        setLoading={setLoading}
      />
      <List
        title="@settings.imp_dup"
        items={items.filter(
          ({ xmlUrl }) => feeds[xmlUrl] && subIds.includes(feeds[xmlUrl]!.id)
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
      <S.BTWrap>
        <Button type="reset" plain>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          Save
        </Button>
      </S.BTWrap>
      {importing && (
        <S.Loading>
          <Spinner />
        </S.Loading>
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
      <S.List>
        {items.map(({ xmlUrl, text }) => (
          <li key={xmlUrl}>{text}</li>
        ))}
      </S.List>
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
    mapValues(feeds, v => v?.id ?? null),
    subs
  )
  const [add, setAddInds] = useDependent(newItems, ({ length }) =>
    Array<boolean>(length).fill(true)
  )
  const selection = useMany(
    (sel, ids) =>
      sel.map((v, i) => v && ids[newItems[i].xmlUrl]).filter(predicate.truthy),
    add,
    mapValues(feeds, v => v?.id)
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

export const useImport = (file_?: File) => {
  const [items, setItems] = useState<OPMLItem[] | null>(null)
  const [text, setText] = useState<string>()
  const [file, setFile] = useDependent(file_)

  const name = useRef(file?.name)
  if (file) name.current = file?.name

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
    if (!doc.querySelector('outline[xmlUrl]'))
      return logInvalidType(name.current)

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
    function onChange({ target }: Event) {
      setFile((target as HTMLInputElement).files![0])
    }

    input.addEventListener('change', onChange)

    return () => {
      input.removeEventListener('change', onChange)
    }
  })

  useEffect(() => {
    if (!file) return
    const reader = new FileReader()
    reader.addEventListener('load', e => {
      setText(e.target!.result as string)
    })
    reader.readAsText(file)
  }, [file])

  return [ref, items] as const
}

function logInvalidType(file = 'This', err?: unknown) {
  if (err) logger.error(err)
  notify.snack({
    lvl: 'error',
    text: `${file} does not look like a valid OPML file.`,
  })
}

const S = {
  Modal: styled.form`
    width: 35rem;
    max-width: calc(100vw - 2rem);
    position: relative;
    padding-bottom: 4rem;

    ul {
      max-height: 47vh;
      overflow-y: scroll;
      margin-top: 0.8rem;
      width: calc(100% + 1rem);
    }

    & > * + :is(details, span) {
      display: block;
      margin-top: 1rem;
    }

    @media (max-width: 600px) and (orientation: portrait) {
      min-height: calc(100vh - 2rem);
    }
  `,

  List: styled.ul`
    padding-inline-start: 1.5rem;
    list-style-type: disc;
    max-height: 33vh;

    li {
      font-size: 0.9rem;
      opacity: 0.9;
      line-height: 1.5;
    }
  `,

  Action: styled.summary`
    input {
      float: right;
    }
  `,

  BTWrap: styled.div`
    display: flex;
    justify-content: space-around;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;

    button {
      width: 11ch;
    }
  `,

  Loading: styled.div`
    position: absolute;
    left: -1rem;
    top: -1rem;
    width: calc(100% + 2rem);
    height: calc(100% + 6rem);
    backdrop-filter: blur(5px);
    display: flex;
    justify-content: space-around;
    align-items: center;
  `,
}
