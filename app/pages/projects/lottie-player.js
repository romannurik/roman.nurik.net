import { customElement, html, LitElement, property } from 'lit-element';
import lottie from 'lottie-web';


@customElement('rn-lottie-player')
export class LottiePlayer extends LitElement {
  @property() src = null;

  connectedCallback() {
    super.connectedCallback();
    this.updateAnimation();
  }

  updated(changedProperties) {
    if (changedProperties.has('src')) {
      this.updateAnimation();
    }
  }

  updateAnimation() {
    this.destroyAnimation();

    if (!this.src) {
      return;
    }

    this.animation = lottie.loadAnimation({
      container: this.shadowRoot.querySelector('div'),
      path: this.src,
      renderer: 'svg',
      loop: true,
      autoplay: true,
    });
  }

  reset() {
    this.animation.goToAndStop(0, true);
  }

  play() {
    this.animation.play();
  }

  pause() {
    this.animation.pause();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.destroyAnimation();
  }

  destroyAnimation() {
    if (this.animation) {
      this.animation.destroy();
    }
  }

  render() {
    return html`<div></div>`;
  }
}