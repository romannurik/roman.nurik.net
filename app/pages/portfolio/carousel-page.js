import { customElement, html, LitElement, property } from 'lit-element';

@customElement('rn-carousel-page')
export class CarouselPage extends LitElement {
  @property() active = false;
  @property() peeking = false;

  updated(changedProperties) {
    if (changedProperties.has('active')) {
      let event = new CustomEvent('activechange');
      this.dispatchEvent(event);
    }
    if (changedProperties.has('peeking')) {
      let event = new CustomEvent('peekingchange');
      this.dispatchEvent(event);
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}
