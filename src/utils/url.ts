export const setQueryParam = (key: string, value: string | number) => {
  const params = new URLSearchParams(location.search)
  params.set(key, value.toString())
  setQueryString(params.toString())
}

export const removeQueryParam = (key: string) => {
  const params = new URLSearchParams(location.search)
  params.delete(key)
  setQueryString(params.toString())
}

export const setQueryString = (query?: string) => {
  if (query === location.search.slice(1)) return
  const newUrl = location.pathname + (query ? `?${query}` : '')
  history.pushState(null, document.title, newUrl)
}
