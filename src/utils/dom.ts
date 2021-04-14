export const scrollParent = (el: HTMLElement | null): HTMLElement =>
  !el || el === document.body
    ? document.body
    : /scroll|auto/.test(getComputedStyle(el).overflowY)
    ? el
    : scrollParent(el.parentElement)
