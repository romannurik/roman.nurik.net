import { customElement, html, LitElement, property } from 'lit-element';

@customElement('rn-carousel-page')
export class CarouselPage extends LitElement {
  @property() active = false;
  @property() peeking = false;

  updated(changedProperties) {
    if (changedProperties.has('active')) {
      this.dispatchEvent(new CustomEvent('activechange'));
    }
    if (changedProperties.has('peeking')) {
      this.dispatchEvent(new CustomEvent('peekingchange'));
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}
