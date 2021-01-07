import { html, PolymerElement } from '@polymer/polymer/polymer-element'
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status'


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

  constructor() {
    super()
    afterNextRender(this, () => {
      if (this.loadStrategy === 'instant') {
        this.loadLarge()
      } else if (this.loadStrategy === 'on-visible') {
        this.observeVisibility()
      }
    })
  }

  loadLarge() {
    this._finalSrc = this.src
    this._finalSrcset = this.srcset
  }

  observeVisibility() {
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

  static get properties() {
    return {
      placeholder: String,

      src: String,
      srcset: String,
      sizes: String,

      alt: String,

      loadStrategy: String,

      placeholderImportance: {
        type: String,
        value: 'high'
      },

      finalImportance: {
        type: String,
        value: 'low'
      },

      intersectionMargin: {
        type: String,
        value: '200px'
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
