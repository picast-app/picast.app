export const scrollParent = (el: HTMLElement | null): HTMLElement =>
  !el || el === document.body
    ? document.body
    : /scroll|auto/.test(getComputedStyle(el).overflowY)
    ? el
    : scrollParent(el.parentElement)

export function createAppended<T extends string>(
  tagName: T,
  node: Node = document.documentElement
): T extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[T]
  : HTMLElement {
  const child = (node.ownerDocument ?? (node as any)).createElement(tagName)
  ;(node instanceof Document ? node.documentElement : node).appendChild(child)
  return child
}

export function setAttributes(
  node: HTMLElement,
  attrs: Record<string, string | number | boolean>
) {
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v as any)
}
