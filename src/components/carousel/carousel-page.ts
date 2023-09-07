import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('rn-carousel-page')
export class CarouselPage extends LitElement {
  @property() active = false;
  @property() peeking = false;

  updated(changedProperties: any) {
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
