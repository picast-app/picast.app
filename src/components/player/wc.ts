import html from './player.html'

const tmpl = document.createElement('template')
tmpl.innerHTML = html

export default class Player extends HTMLElement {
  constructor() {
    super()
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.appendChild(tmpl.content.cloneNode(true))
  }
}

customElements.define('picast-player', Player)
