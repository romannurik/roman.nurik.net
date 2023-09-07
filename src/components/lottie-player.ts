import { css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import lottie, { type AnimationItem } from 'lottie-web';

@customElement('rn-lottie-player')
export class LottiePlayer extends LitElement {
  animation?: AnimationItem;
  _fetching = false;
  @property() src = null;

  connectedCallback() {
    super.connectedCallback();
    this.updateAnimation();
  }

  static get styles() {
    return css`
      :host {
        display: inline-block;
        width: var(--intrinsic-width);
        height: var(--intrinsic-height);
        min-width: 100%;
        max-width: 100%;
        min-height: 100%;
        max-height: 100%;      
      }
    `;
  }

  updated(changedProperties: any) {
    if (changedProperties.has('src')) {
      this.updateAnimation();
    }
  }

  async updateAnimation() {
    this.destroyAnimation();

    if (!this.src) {
      return;
    }

    let container = this.shadowRoot?.getRootNode() as Element;
    if (!container) {
      return;
    }

    if (this._fetching) {
      return;
    }

    this._fetching = true;
    let animationData = await fetch(this.src).then(r => r.json());
    this._fetching = false;
    let { w, h } = animationData;
    this.style.setProperty('--intrinsic-width', `${w}px`);
    this.style.setProperty('--intrinsic-height', `${h}px`);
    this.animation = lottie.loadAnimation({
      container,
      animationData,
      renderer: 'svg',
      loop: true,
      autoplay: false,
    });
  }

  reset() {
    this.animation?.goToAndStop(0, true);
  }

  play() {
    this.animation?.play();
  }

  pause() {
    this.animation?.pause();
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
    return null;
  }
}