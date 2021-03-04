export const setQueryParam = (
  key: string,
  value: string | number,
  replace = false
) => {
  const params = new URLSearchParams(location.search)
  params.set(key, value.toString())
  setQueryString(params.toString(), replace)
}

export const removeQueryParam = (key: string, replace = false) => {
  const params = new URLSearchParams(location.search)
  params.delete(key)
  setQueryString(params.toString(), replace)
}

export const setQueryString = (query?: string, replace = false) => {
  if (query === location.search.slice(1)) return
  const newUrl = location.pathname + (query ? `?${query}` : '')
  if (replace) history.replaceState(null, document.title, newUrl)
  else history.pushState(null, document.title, newUrl)
}
