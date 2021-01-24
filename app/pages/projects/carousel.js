import { css, customElement, html, LitElement, property, queryAssignedNodes } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';
import styleSheet from './carousel.lit.scss';
import './carousel-page';

@customElement('rn-carousel')
export class Carousel extends LitElement {
  pageCenters = [];
  prevEdgeThreshold = 0;
  nextEdgeThreshold = 0;

  @property() numPages = 0; // TODO: is @property right for this? is there something like state for lit-element?
  @property() activePage = -1;
  @property() prevEdgeVisible = false;
  @property() nextEdgeVisible = false;

  @queryAssignedNodes() // TODO: filter to rn-carousel-page once the lit-element bug is fixed
  slottedNodes = [];

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
    this.resizeObserver.unobserve(this);
  }

  static get styles() {
    return css([styleSheet]);
  }

  get pages() {
    return (this.slottedNodes || []).filter(node =>
        node.nodeType === Node.ELEMENT_NODE && node.tagName === 'RN-CAROUSEL-PAGE');
  }

  updated() {
    this.numPages = this.pages.length;
  }

  childrenChange() {
    this.numPages = this.slottedNodes.length;
    this.recomputeMetrics();
    this.recomputeActivePage();
  }

  recomputeMetrics() {
    this.style.setProperty('--width', `${this.offsetWidth}px`);
    this.pageCenters = this.pages.map(el => el.offsetLeft + el.offsetWidth / 2);
    // TODO: support non-px units
    let edgeSize = parseFloat(window.getComputedStyle(this).getPropertyValue('--page-peek')) +
        parseFloat(window.getComputedStyle(this).getPropertyValue('--page-spacing'));
    this.prevEdgeThreshold = edgeSize;
    this.nextEdgeThreshold = this.shadowRoot.querySelector('.scroller').scrollWidth - edgeSize;
  }

  scrollLeftForPage(page) {
    return this.pageCenters[page] - this.offsetWidth / 2;
  }

  pageForScrollLeft(scrollLeft) {
    let width = this.offsetWidth;
    let minDistance = Infinity;
    let closestPage = 0;
    for (let [page, center] of this.pageCenters.entries()) {
      let dist = Math.abs((scrollLeft + width / 2) - center);
      if (dist < minDistance) {
        minDistance = dist;
        closestPage = page;
      }
    }
    return closestPage;
  }

  snapToPage(index, {immediate = false} = {}) {
    index = Math.max(0, Math.min(this.numPages - 1, index));
    let scroller = this.shadowRoot.querySelector('.scroller');
    scroller.scrollTo({
      left: this.scrollLeftForPage(index),
      behavior: immediate ? 'auto' : 'smooth'
    });
  }

  handleScroll(ev) {
    this.recomputeActivePage();
  }

  recomputeActivePage() {
    let scrollLeft = this.shadowRoot.querySelector('.scroller').scrollLeft;
    let page = this.pageForScrollLeft(scrollLeft);
    if (this.activePage !== page) {
      this.activePage = page;
      this.pages.forEach((page, idx) => {
        page.active = this.activePage === idx;
        page.peeking = this.activePage - 1 <= idx && idx <= this.activePage + 1;
      });
    }
    this.prevEdgeVisible = scrollLeft > this.prevEdgeThreshold;
    this.nextEdgeVisible = scrollLeft + this.scrollWidth < this.nextEdgeThreshold;
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
      <div class="scroller" @scroll=${this.handleScroll}>
        <slot @slotchange=${this.childrenChange}></slot>
      </div>
      ${this.numPages >= 2 ? html`<div class="dots">
        ${Array(this.numPages).fill().map((_, idx) => html`
          <div class=${classMap({ dot: true, 'is-active': this.activePage === idx })}
              @click=${() => this.snapToPage(idx)}></div>
        `)}
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
