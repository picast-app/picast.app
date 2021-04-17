export default abstract class WebComponent extends HTMLElement {
  constructor() {
    super()
    const shadow = this.attachShadow({ mode: (this.constructor as any).mode })
    shadow.appendChild(
      (this.constructor as any).template.content.cloneNode(true)
    )
  }

  public static createTemplate(content: string): HTMLTemplateElement {
    const template = document.createElement('template')
    template.innerHTML = content
    return template
  }

  public static readonly template: HTMLTemplateElement
  public static readonly mode: ShadowRootMode = 'open'
  public static readonly tagName: string
}
