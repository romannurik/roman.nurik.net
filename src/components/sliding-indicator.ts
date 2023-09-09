import { invLerpClamp, lerp } from '@/util/lerp';
import BezierEasing from 'bezier-easing';
import { LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

// combined, these parameters control the exaggeration of the indicator blob
// movement
const INDICATOR_EASING = BezierEasing(0.9, 0, 0.1, 1);
const TRAILING_START = 0.4; // trailing animation runs between t = [n, 1]
const LEADING_END = 0.6; // leading animation runs between t = [0, n]

@customElement('rn-sliding-indicator')
export class SlidingIndicator extends LitElement {
  // if the current animation is based on a precise request like clicking an exact
  // page dot or left/right keys
  animStartTime?: number;
  animDuration?: number;
  left = 0;
  right = 0;
  srcLeft = 0;
  srcRight = 0;
  cancel?: number;
  @query('[part=indicator]') indicator?: HTMLElement;
  @property() targetLeft = 0;
  @property() targetRight = 0;

  connectedCallback() {
    super.connectedCallback();
    this.updateIndicator();
  }

  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
        pointer-events: none;
      }
      :host::part(indicator) {
        position: absolute;
        height: 100%;
        background-color: currentColor;
        box-sizing: border-box;
      }
    `;
  }

  slideTo(target: HTMLElement, paddingX?: number) {
    let self = this.getBoundingClientRect();
    let tRect = target.getBoundingClientRect();
    this.targetLeft = tRect.left - self.left + (paddingX || 0);
    this.targetRight = tRect.right - self.left - (paddingX || 0);
  }

  updated(changedProperties: any) {
    if (changedProperties.has('targetLeft') || changedProperties.has('targetRight')) {
      this.updateIndicator();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.destroyAnimation();
  }

  destroyAnimation() {
    this.cancel && window.cancelAnimationFrame(this.cancel);
  }

  updateIndicator() {
    // kick off new indicator animation if it isn't already happening
    this.cancel && window.cancelAnimationFrame(this.cancel);

    this.srcLeft = this.left;
    this.srcRight = this.right;
    // this.animatingPrecisely = preciseAnimation;
    this.animStartTime = Date.now();
    this.animDuration = 500; // fixed duration
    if (this.left === this.right) {
      this.animDuration = 1; // hack for initial state
    }

    // dynamic duration doesn't quite work with smooth scrollto, as they start competing
    // const speed = 100; // pixels per second
    // this.animDuration = Math.max(
    //   Math.abs(this.targetLeft - this.srcLeft),
    //   Math.abs(this.targetRight - this.srcRight)) * 1000 / speed;

    this.cancel = window.requestAnimationFrame(() => this.tickIndicator());
  }

  tickIndicator() {
    // indicator animation tick

    let t = invLerpClamp(this.animStartTime || 0, (this.animStartTime || 0) + (this.animDuration || 1), Date.now());
    if (t >= 1) {
      // animation is done!
      this.left = this.targetLeft;
      this.right = this.targetRight;
      this.indicator!.style.left = this.left + 'px';
      this.indicator!.style.width = (this.right - this.left) + 'px';
      this.animStartTime = undefined;
      this.animDuration = undefined;
      // TODO: trigger animation end event
      // this.animatingPrecisely = undefined; // reset flag
      const options = {
        detail: {},
        bubbles: true,
        composed: true
      };
      this.dispatchEvent(new CustomEvent('animationend', options));
      return;
    }

    // leading = movement in first part of anim, trailing = last part of anim
    // the discrepancy between leading and trailing creates the blob effect
    let leftTrailing = this.targetLeft > this.srcLeft;
    let rightTrailing = this.targetRight < this.srcRight;
    let leftT = leftTrailing ? invLerpClamp(TRAILING_START, 1, t) : invLerpClamp(0, LEADING_END, t);
    let rightT = rightTrailing ? invLerpClamp(TRAILING_START, 1, t) : invLerpClamp(0, LEADING_END, t);

    this.left = lerp(this.srcLeft, this.targetLeft, INDICATOR_EASING(leftT));
    this.right = lerp(this.srcRight, this.targetRight, INDICATOR_EASING(rightT));
    this.indicator!.style.left = this.left + 'px';
    this.indicator!.style.width = (this.right - this.left) + 'px';

    this.cancel = window.requestAnimationFrame(() => this.tickIndicator());
  }

  render() {
    return html`<div part="indicator"></div>`;
  }
}