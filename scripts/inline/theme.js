document.documentElement.dataset.theme = window.matchMedia(
  '(prefers-color-scheme: dark)'
).matches
  ? localStorage.getItem('custom-theme') === 'light'
    ? 'light'
    : 'dark'
  : localStorage.getItem('custom-theme') === 'dark'
  ? 'dark'
  : 'light'
