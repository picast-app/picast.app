export const apply = (
  theme: Exclude<Podcast['palette'], undefined>,
  element: HTMLElement,
  dark: boolean
) => {
  const primary = dark ? theme.lightVibrant : theme.darkVibrant
  if (!primary) return
  element.style.setProperty('--cl-primary', primary)
  const select = dark ? theme.darkMuted : theme.darkMuted
  if (select) element.style.setProperty('--cl-select', select)
  else element.style.removeProperty('--cl-select')
}

export const remove = (element: HTMLElement) => {
  element.style.removeProperty('--cl-primary')
  element.style.removeProperty('--cl-select')
}
