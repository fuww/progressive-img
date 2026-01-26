import templateContent from './template.html';

const template = document.createElement('template');

template.innerHTML = templateContent;

const setOrRemoveAttribute = (element, attribute, value) => {
  if (typeof value === 'string') {
    element.setAttribute(attribute, value);
  } else {
    element.removeAttribute(attribute);
  }
};

class ProgressiveImg extends HTMLElement {
  static get is() {
    return 'progressive-img';
  }

  static get observedAttributes() {
    return [
      'placeholder',
      'src',
      'srcset',
      'sizes',
      'alt',
      'load-strategy',
      'placeholder-load-strategy',
      'placeholder-fetch-priority',
      'final-fetchpriority',
      'intersection-margin',
      'placeholder-intersection-margin',
      'original',
    ];
  }

  finalLoaded() {
    this.container.setAttribute('loaded', true);
    if (this.hasAttribute('original')) {
      this.setAttribute('lightbox-ready', '');
    }
  }

  onPlaceholderError() {
    this.placeholder.setAttribute('failed', true);
    this.dispatchEvent(new CustomEvent('placeholderError', {
      detail: {
        src: this.getAttribute('placeholder'),
      },
    }));
  }

  onError() {
    this.dispatchEvent(new CustomEvent('error', {
      detail: {
        src: this.getAttribute('src'),
        srcset: this.getAttribute('srcset'),
      },
    }));
  }

  loadLarge() {
    setOrRemoveAttribute(this.final, 'src', this.getAttribute('src'));
    setOrRemoveAttribute(this.final, 'srcset', this.getAttribute('srcset'));
  }

  loadPlaceholder() {
    setOrRemoveAttribute(this.placeholder, 'src', this.getAttribute('placeholder'));
  }

  observeElementVisibility(name, element, rootMargin, onVisible) {
    if (this[name]) {
      this[name].disconnect();
    }

    this[name] = new IntersectionObserver((nodes) => {
      if (nodes[0].isIntersecting) {
        onVisible();
        this[name].disconnect();
      }
    }, {
      rootMargin,
    });
    this[name].observe(element);
  }

  observeVisibility() {
    this.observeElementVisibility(
      'observer',
      this.placeholder,
      this.getAttribute('intersection-margin') || '400px',
      this.loadLarge.bind(this),
    );
  }

  observePlaceholderVisibility() {
    this.observeElementVisibility(
      'placeholderObserver',
      this.placeholder,
      this.getAttribute('placeholder-intersection-margin') || '800px',
      this.loadPlaceholder.bind(this),
    );
  }

  loadImages() {
    const placeholderLoadStrategy = this.getAttribute('placeholder-load-strategy') || 'on-visible';
    if (placeholderLoadStrategy === 'instant') {
      this.loadPlaceholder();
    } else if (placeholderLoadStrategy === 'on-visible') {
      this.observePlaceholderVisibility();
    }

    const loadStrategy = this.getAttribute('load-strategy') || 'on-visible';
    if (loadStrategy === 'instant') {
      this.loadLarge();
    } else if (loadStrategy === 'on-visible') {
      this.observeVisibility();
    }
  }

  reset() {
    const alt = this.getAttribute('alt');
    setOrRemoveAttribute(this.placeholder, 'alt', alt);
    setOrRemoveAttribute(this.final, 'alt', alt);

    setOrRemoveAttribute(this.final, 'sizes', this.getAttribute('sizes'));

    this.placeholder.setAttribute('fetchpriority', this.getAttribute('placeholder-fetchpriority') || 'high');
    this.final.setAttribute('fetchpriority', this.getAttribute('final-fetchpriority') || 'low');

    this.placeholder.removeAttribute('failed');
    this.container.removeAttribute('loaded');
    this.removeAttribute('lightbox-ready');

    this.loadImages();
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.container = this.shadowRoot.querySelector('.container');
    this.container.addEventListener('click', this.loadLarge.bind(this));
    this.container.addEventListener('click', () => {
      if (this.hasAttribute('original') && this.container.hasAttribute('loaded')) {
        this.dispatchEvent(new CustomEvent('lightbox-request', {
          bubbles: true,
          composed: true,
          detail: {
            placeholder: this.getAttribute('src'),
            srcset: this.getAttribute('srcset'),
            sizes: this.getAttribute('sizes'),
            src: this.getAttribute('original'),
            alt: this.getAttribute('alt'),
          },
        }));
      }
    });

    this.placeholder = this.shadowRoot.querySelector('.placeholder');
    this.placeholder.addEventListener('error', this.onPlaceholderError.bind(this));

    this.final = this.shadowRoot.querySelector('.final');
    this.final.addEventListener('error', this.onError.bind(this));
    this.final.addEventListener('load', this.finalLoaded.bind(this));
  }

  connectedCallback() {
    this.reset();
  }

  attributeChangedCallback() {
    this.reset();
  }
}

window.customElements.define(ProgressiveImg.is, ProgressiveImg);
