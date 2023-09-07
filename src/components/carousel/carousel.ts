import cn from 'classnames';
import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, queryAssignedElements, state } from 'lit/decorators.js';
import { CarouselPage } from './carousel-page';
import styleSheet from './carousel.lit.scss?inline';
import BezierEasing from 'bezier-easing';

// combined, these parameters control the exaggeration of the indicator blob
// movement
const INDICATOR_EASING = BezierEasing(0.9, 0, 0.1, 1);
const TRAILING_START = 0.4; // trailing animation runs between t = [n, 1]
const LEADING_END = 0.6; // leading animation runs between t = [0, n]

// probably over-engineered pagination indicator animation
interface IndicatorState {
  // if the current animation is based on a precise request like clicking an exact
  // page dot or left/right keys
  animatingPrecisely?: boolean;
  animStartTime?: number;
  animDuration?: number;
  left: number;
  right: number;
  srcLeft: number;
  srcRight: number;
  targetLeft: number;
  targetRight: number;
  indicator?: HTMLElement;
  cancel?: number;
}

@customElement('rn-carousel')
export class Carousel extends LitElement {
  pageCenters: number[] = [];
  prevEdgeThreshold = 0;
  nextEdgeThreshold = 0;
  indicatorState: IndicatorState = { left: 0, right: 0, targetLeft: 0, targetRight: 0, srcLeft: 0, srcRight: 0 };
  resizeObserver?: ResizeObserver;

  @state() numPages = 0;
  @state() activePage = -1;
  @state() prevEdgeVisible = false;
  @state() nextEdgeVisible = false;

  @queryAssignedElements({ selector: 'rn-carousel-page' }) // TODO: filter to rn-carousel-page once the lit-element bug is fixed
  pages?: Array<CarouselPage>;

  connectedCallback() {
    super.connectedCallback();
    // WARNING: for some reason if this is below the resizeObserver,
    // it never takes effect on iOS Safari (at least in the simulator)
    this.classList.remove('cloak');
    this.resizeObserver = new ResizeObserver(() => this.recomputeMetrics());
    this.resizeObserver.observe(this);
    setTimeout(() => this.childrenChange());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver?.unobserve(this);
  }

  static get styles() {
    return unsafeCSS([styleSheet]);
  }

  updated() {
    this.numPages = this.pages?.length || 0;
  }

  childrenChange() {
    this.numPages = this.pages?.length || 0;
    this.recomputeMetrics();
    this.recomputeActivePage();
  }

  recomputeMetrics() {
    this.style.setProperty('--width', `${this.offsetWidth}px`);
    this.pageCenters = (this.pages || []).map(el => el.offsetLeft + el.offsetWidth / 2);
    // TODO: support non-px units
    let edgeSize = parseFloat(window.getComputedStyle(this).getPropertyValue('--page-peek')) +
      parseFloat(window.getComputedStyle(this).getPropertyValue('--page-spacing-x'));
    this.prevEdgeThreshold = edgeSize;
    this.nextEdgeThreshold = this.shadowRoot!.querySelector('.scroller')!.scrollWidth - edgeSize;
  }

  scrollLeftForPage(page: number): number {
    return this.pageCenters[page] - this.offsetWidth / 2;
  }

  /**
   * Returns a position (e.g. 0.5 indicating you're midway between item 1 and 2)
   * for the given scroll offset
   */
  positionForScrollLeft(scrollLeft: number): number {
    let width = this.offsetWidth;
    let scrollCenter = scrollLeft + width / 2;
    // assumes page centers are sorted left to right
    for (let [page, center] of this.pageCenters.entries()) {
      if (scrollCenter >= center) {
        let nextCenter = (page < this.pageCenters.length - 1) ? this.pageCenters[page + 1] : Infinity;
        return invLerp(center, nextCenter, scrollCenter);
      }
    }
    return 0;
  }

  pageForScrollLeft(scrollLeft: number): number {
    return Math.round(this.positionForScrollLeft(scrollLeft));
  }

  snapToPage(index: number, { immediate = false, focusPage = false } = {}) {
    index = Math.max(0, Math.min(this.numPages - 1, index));
    let scroller = this.shadowRoot!.querySelector('.scroller');
    scroller!.scrollTo({
      left: this.scrollLeftForPage(index),
      behavior: immediate ? 'auto' : 'smooth'
    });
    if (focusPage) {
      this.pages?.[index].focus({ preventScroll: true });
    }
    this.updateIndicator(index);
  }

  handleScroll(ev: Event) {
    this.recomputeActivePage();
  }

  handleKeydown(ev: KeyboardEvent) {
    // custom left/right key handling because focus-visible is hard (see below)
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight' || ev.key == 'PageUp' || ev.key === 'PageDown') {
      this.snapToPage(this.activePage + (ev.key === 'ArrowLeft' || ev.key === 'PageUp' ? -1 : 1), {
        immediate: true, // to make left/right as snappy as possible
        focusPage: true
      });
      ev.preventDefault();
    } else if (ev.key === 'Home' || ev.key === 'End') {
      this.snapToPage((ev.key === 'Home' ? 0 : (this.pages?.length || 1) - 1), {
        immediate: true, // to make left/right as snappy as possible
        focusPage: true
      });
      ev.preventDefault();
    }
  }

  _updateIndicatorTimeout = 0;

  recomputeActivePage() {
    let scrollLeft = this.shadowRoot!.querySelector('.scroller')!.scrollLeft;
    let page = this.pageForScrollLeft(scrollLeft);
    if (this.activePage !== page) {
      this.activePage = page;
      (this.pages || []).forEach((page, idx) => {
        page.active = this.activePage === idx;
        page.tabIndex = page.active ? 0 : -1;
        // don't page.focus() to avoid focus rectangles, since :focus-visible
        // is true for .focus()
        page.peeking = this.activePage - 1 <= idx && idx <= this.activePage + 1;
      });
    }
    this.prevEdgeVisible = scrollLeft > this.prevEdgeThreshold;
    this.nextEdgeVisible = scrollLeft + this.scrollWidth < this.nextEdgeThreshold;

    // debounced indicator update
    if (this._updateIndicatorTimeout) {
      window.clearTimeout(this._updateIndicatorTimeout);
    }
    this._updateIndicatorTimeout = window.setTimeout(() => {
      this.updateIndicator();
    }, 5);
  }

  updateIndicator(page?: number) {
    let dots = this.shadowRoot!.querySelector('.dots');
    if (!dots) {
      return;
    }

    let preciseAnimation = page !== undefined;
    if (this.indicatorState.animatingPrecisely && !preciseAnimation) {
      // currently animating precisely, don't interrupt unless this is
      // also a precise animation
      return;
    }

    // What's the target page and left/right for the indicator?
    page = page ?? this.activePage;
    let dotsRect = dots.getBoundingClientRect();
    let f = page / (this.numPages - 1);
    let targetLeft = (dotsRect.width - dotsRect.height) * f;
    let targetRight = (dotsRect.width - dotsRect.height) * f + dotsRect.height;

    if (this.indicatorState.targetLeft === targetLeft &&
      this.indicatorState.targetRight === targetRight) {
      // already animating to the right location
      return;
    }

    // kick off a new, or change the current animation
    this.indicatorState.targetLeft = targetLeft;
    this.indicatorState.targetRight = targetRight;

    // kick off new indicator animation if it isn't already happening
    this.indicatorState.indicator = this.shadowRoot!.querySelector('.dot-indicator') || undefined;
    this.indicatorState.cancel && window.cancelAnimationFrame(this.indicatorState.cancel);

    this.indicatorState.srcLeft = this.indicatorState.left;
    this.indicatorState.srcRight = this.indicatorState.right;
    this.indicatorState.animatingPrecisely = preciseAnimation;
    this.indicatorState.animStartTime = Date.now();
    this.indicatorState.animDuration = 500; // fixed duration
    if (this.indicatorState.left === this.indicatorState.right) {
      this.indicatorState.animDuration = 1; // hack for initial state
    }

    // dynamic duration doesn't quite work with smooth scrollto, as they start competing
    // const speed = 100; // pixels per second
    // this.indicatorState.animDuration = Math.max(
    //   Math.abs(this.indicatorState.targetLeft - this.indicatorState.srcLeft),
    //   Math.abs(this.indicatorState.targetRight - this.indicatorState.srcRight)) * 1000 / speed;

    this.indicatorState.cancel = window.requestAnimationFrame(() => this.tickIndicator());
  }

  tickIndicator() {
    // indicator animation tick
    let { indicator, animStartTime, animDuration, srcLeft, srcRight, targetLeft, targetRight } = this.indicatorState;
    let t = invLerpClamp(animStartTime || 0, (animStartTime || 0) + (animDuration || 1), Date.now());
    if (t >= 1) {
      // animation is done!
      this.indicatorState.left = this.indicatorState.targetLeft;
      this.indicatorState.right = this.indicatorState.targetRight;
      indicator!.style.left = this.indicatorState.left + 'px';
      indicator!.style.width = (this.indicatorState.right - this.indicatorState.left) + 'px';
      this.indicatorState.animStartTime = undefined;
      this.indicatorState.animDuration = undefined;
      this.indicatorState.animatingPrecisely = undefined; // reset flag
      return;
    }

    // leading = movement in first part of anim, trailing = last part of anim
    // the discrepancy between leading and trailing creates the blob effect
    let leftTrailing = targetLeft > srcLeft;
    let rightTrailing = targetRight < srcRight;
    let leftT = leftTrailing ? invLerpClamp(TRAILING_START, 1, t) : invLerpClamp(0, LEADING_END, t);
    let rightT = rightTrailing ? invLerpClamp(TRAILING_START, 1, t) : invLerpClamp(0, LEADING_END, t);

    this.indicatorState.left = lerp(srcLeft, targetLeft, INDICATOR_EASING(leftT));
    this.indicatorState.right = lerp(srcRight, targetRight, INDICATOR_EASING(rightT));
    indicator!.style.left = this.indicatorState.left + 'px';
    indicator!.style.width = (this.indicatorState.right - this.indicatorState.left) + 'px';

    this.indicatorState.cancel = window.requestAnimationFrame(() => this.tickIndicator());
  }

  render() {
    let edge = html`
      <svg class="shade" preserveAspectRatio="none" width="16" height="400" viewBox="0 0 16 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 0H0V400H4C4 400 16 400 16 200C16 0 4 0 4 0Z" fill="#ccc"/>
      </svg>
      <svg class="button-indent" width="24" height="130" viewBox="0 0 24 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0V130C0 94 24 90 24 65C24 40 0 36 0 0Z" fill="var(--background-color)"/>
      </svg>
      <i class="material-icons">chevron_left</i>
    `;

    return html`
      <link rel="stylesheet" href="//fonts.googleapis.com/icon?family=Material+Icons">
      <div class="scroller"
        @scroll=${this.handleScroll}
        @keydown=${this.handleKeydown}>
        <slot @slotchange=${this.childrenChange}></slot>
      </div>
      ${this.numPages >= 2 ? html`<div class="dots-container">
        <div class="dots">
          ${Array(this.numPages).fill(0).map((_, idx) => html`
            <div class=${cn('dot', { 'is-active': this.activePage === idx })}
                @click=${() => this.snapToPage(idx)}></div>
          `)}
          <div class="dot-indicator"></div>
        </div>
      </div>` : ''}
      <button
          tabindex="-1"
          class="edge prev"
          ?disabled=${!this.prevEdgeVisible}
          aria-label="Previous"
          @click=${() => this.snapToPage(this.activePage - 1)}>
        ${edge}
      </button>
      <button
          tabindex="-1"
          class="edge next"
          ?disabled=${!this.nextEdgeVisible}
          aria-label="Next"
          @click=${() => this.snapToPage(this.activePage + 1)}>
        ${edge}
      </button>
    `;
  }
}

/**
 * Compute value V that is fraction T of the way from A to B
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * lerp, but clamped between A and B
 */
function lerpClamp(a: number, b: number, t: number): number {
  return Math.max(Math.min(a, b), Math.min(Math.max(a, b), lerp(a, b, t)));
}

/**
 * Compute fraction T that value V is along the way from A to B
 */
function invLerp(a: number, b: number, v: number): number {
  if (b === a) return 0;
  return (v - a) / (b - a);
}

/**
 * invLerp, but clamped between 0 and 1
 */
function invLerpClamp(a: number, b: number, v: number): number {
  return Math.max(0, Math.min(1, invLerp(a, b, v)));
}