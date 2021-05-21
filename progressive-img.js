import { html, PolymerElement } from '@polymer/polymer/polymer-element'

class ProgressiveImg extends PolymerElement {
  static get is() {
    return 'progressive-img'
  }

  static get template() {
    return html`
      <style>
        :host {
          display: block;
          --placeholder-filter: blur(10px) saturate(1.2);
          --img-object-fit: contain;
          --img-object-position: 50% 50%;
          --img-height: auto;
          --img-width: 100%;
          --img-max-height: none;
        }

        .container {
          overflow: hidden;
          position: relative;
          height: var(--img-height);
        }

        img {
          display: block;
          width: var(--img-width);
          object-fit: var(--img-object-fit);
          object-position: var(--img-object-position);
          height: var(--img-height);
          max-height: var(--img-max-height);
        }

        img.placeholder {
          filter: var(--placeholder-filter);
        }

        [loaded] .placeholder {
          position: absolute;
          display: none;
        }

        img.final {
          position: absolute;
          display: none;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
        }

        [loaded] .final {
          position: static;
          display: block;
        }

      </style>

      <div class="container" on-click="loadLarge" loaded$="[[_loaded]]">
          <img class="placeholder" importance$="[[placeholderImportance]]" src$="[[placeholder]]" alt$="[[alt]]">
          <img class="final" importance$="[[finalImportance]]" src$="[[_finalSrc]]" srcset$="[[_finalSrcset]]" sizes$="[[sizes]]" alt$="[[alt]]" on-load="finalLoaded">
      </div>
    `
  }

  connectedCallback() {
    super.connectedCallback()

    this.shadowRoot.querySelector('.placeholder')
      .addEventListener('error', this.onPlaceholderError.bind(this))
    this.shadowRoot.querySelector('.final')
      .addEventListener('error', this.onError.bind(this))

    this.loadImages()
  }

  loadImages() {
    if (this.loadStrategy === 'instant') {
      this.loadLarge()
    } else if (this.loadStrategy === 'on-visible') {
      this.observeVisibility()
    }
  }

  reset() {
    this._finalSrc = null
    this._finalSrcset = null
    this._loaded = false

    this.loadImages()
  }

  loadLarge() {
    this._finalSrc = this.src
    this._finalSrcset = this.srcset
  }

  observeVisibility() {
    if (this.observer) {
      this.observer.disconnect()
    }

    this.observer = new IntersectionObserver((nodes) => {
      if (nodes[0].isIntersecting) {
        this.loadLarge()
        this.observer.disconnect()
      }
    }, {
      rootMargin: this.intersectionMargin
    })
    this.observer.observe(this.shadowRoot.querySelector('.placeholder'))
  }

  finalLoaded() {
    this._loaded = true
  }

  onPlaceholderError() {
    this.dispatchEvent(new CustomEvent('placeholderError', {
      detail: {
        src: this.placeholder
      }
    }))
  }

  onError() {
    this.dispatchEvent(new CustomEvent('error', {
      detail: {
        src: this.src,
        srcset: this.srcset
      }
    }))
  }

  static get properties() {
    return {
      placeholder: {
        type: String,
        observer() { this.reset() }
      },

      src: {
        type: String,
        observer() { this.reset() }
      },
      srcset: {
        type: String,
        observer() { this.reset() }
      },
      sizes: {
        type: String,
        observer() { this.reset() }
      },

      alt: {
        type: String,
        observer() { this.reset() }
      },

      loadStrategy: {
        type: String,
        observer() { this.reset() }
      },

      placeholderImportance: {
        type: String,
        value: 'high',
        observer() { this.reset() }
      },

      finalImportance: {
        type: String,
        value: 'low',
        observer() { this.reset() }
      },

      intersectionMargin: {
        type: String,
        value: '200px',
        observer() { this.reset() }
      },

      _finalSrc: String,
      _finalSrcset: String,
      _loaded: {
        type: Boolean,
        value: false
      }
    }
  }
}

window.customElements.define(ProgressiveImg.is, ProgressiveImg)
