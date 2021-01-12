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
    this.resizeObserver = new ResizeObserver(() => this.recomputeMetrics());
    this.resizeObserver.observe(this);
    this.classList.remove('cloak');
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

  snapToPage(index) {
    index = Math.max(0, Math.min(this.numPages - 1, index));
    let scroller = this.shadowRoot.querySelector('.scroller');
    scroller.scrollTo({
      left: this.scrollLeftForPage(index),
      behavior: 'smooth'
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
    return html`
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
          @click=${() => this.snapToPage(this.activePage - 1)}></button>
      <button
          tabindex="-1"
          class="edge next"
          ?disabled=${!this.nextEdgeVisible}
          aria-label="prev"
          @click=${() => this.snapToPage(this.activePage + 1)}></button>
    `;
  }
}
