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
  #container;

  #placeholderImage;

  #finalImage;

  #observer;

  #placeholderObserver;

  #initialized = false;

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
    ];
  }

  finalLoaded() {
    this.#container.setAttribute('loaded', true);
  }

  onPlaceholderError() {
    this.#placeholderImage.setAttribute('failed', true);
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
    setOrRemoveAttribute(this.#finalImage, 'src', this.getAttribute('src'));
    setOrRemoveAttribute(this.#finalImage, 'srcset', this.getAttribute('srcset'));
  }

  loadPlaceholder() {
    setOrRemoveAttribute(this.#placeholderImage, 'src', this.getAttribute('placeholder'));
  }

  static observeElementVisibility(previousObserver, element, rootMargin, onVisible) {
    if (previousObserver) {
      previousObserver.disconnect();
    }

    const observer = new IntersectionObserver((nodes) => {
      if (nodes[0].isIntersecting) {
        onVisible();
        observer.disconnect();
      }
    }, {
      rootMargin,
    });
    observer.observe(element);
    return observer;
  }

  observeVisibility() {
    this.#observer = ProgressiveImg.observeElementVisibility(
      this.#observer,
      this.#placeholderImage,
      this.getAttribute('intersection-margin') || '400px',
      this.loadLarge.bind(this),
    );
  }

  observePlaceholderVisibility() {
    this.#placeholderObserver = ProgressiveImg.observeElementVisibility(
      this.#placeholderObserver,
      this.#placeholderImage,
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
    setOrRemoveAttribute(this.#placeholderImage, 'alt', alt);
    setOrRemoveAttribute(this.#finalImage, 'alt', alt);

    setOrRemoveAttribute(this.#finalImage, 'sizes', this.getAttribute('sizes'));

    this.#placeholderImage.setAttribute('fetchpriority', this.getAttribute('placeholder-fetchpriority') || 'high');
    this.#finalImage.setAttribute('fetchpriority', this.getAttribute('final-fetchpriority') || 'low');

    this.#placeholderImage.removeAttribute('failed');
    this.#container.removeAttribute('loaded');

    this.loadImages();
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.#container = this.shadowRoot.querySelector('.container');
    this.#container.addEventListener('click', this.loadLarge.bind(this));

    this.#placeholderImage = this.shadowRoot.querySelector('.placeholder');
    this.#placeholderImage.addEventListener('error', this.onPlaceholderError.bind(this));

    this.#finalImage = this.shadowRoot.querySelector('.final');
    this.#finalImage.addEventListener('error', this.onError.bind(this));
    this.#finalImage.addEventListener('load', this.finalLoaded.bind(this));
  }

  connectedCallback() {
    this.#initialized = true;
    this.reset();
  }

  disconnectedCallback() {
    this.#initialized = false;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.#initialized) {
      this.reset();
    }
  }
}

window.customElements.define(ProgressiveImg.is, ProgressiveImg);
