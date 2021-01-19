import { css, customElement, LitElement, property } from 'lit-element';
import lottie from 'lottie-web';


@customElement('rn-lottie-player')
export class LottiePlayer extends LitElement {
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

    let container = this.shadowRoot;
    if (!container) {
      return;
    }

    if (this._fetching) {
      return;
    }

    this._fetching = true;
    fetch(this.src).then(r => r.json()).then(animationData => {
      this._fetching = false;
      let {w, h} = animationData;
      this.style.setProperty('--intrinsic-width', `${w}px`);
      this.style.setProperty('--intrinsic-height', `${h}px`);
      this.animation = lottie.loadAnimation({
        container,
        animationData,
        renderer: 'svg',
        loop: true,
        autoplay: false,
      });
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
    return null;
  }
}