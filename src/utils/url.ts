import history from 'utils/history'

export const setQueryParam = (
  key: string,
  value: string | number,
  replace = false
) => {
  const params = new URLSearchParams(location.search)
  params.set(key, value.toString())
  setUrl({ query: params.toString() }, replace)
}

export const removeQueryParam = (key: string, replace = false) => {
  const params = new URLSearchParams(location.search)
  params.delete(key)
  setUrl({ query: params.toString() }, replace)
}

type UrlComps = {
  path?: string
  query?: string | null
  hash?: string | null
}

export const setUrl = ({ path, query, hash }: UrlComps, replace = false) => {
  if (query && !query.startsWith('?')) query = '?' + query
  if (hash && !hash.startsWith('#')) hash = '#' + hash

  if (
    (path === undefined || path === location.pathname) &&
    (query === undefined || query === location.search) &&
    (hash === undefined || hash === location.hash)
  )
    return

  let newUrl = path ?? location.pathname
  if (hash !== null && (hash ?? location.hash)) newUrl += hash ?? location.hash
  if (query !== null && (query ?? location.search))
    newUrl += query ?? location.search

  if (replace) history.replace(newUrl)
  else history.push(newUrl)
}
