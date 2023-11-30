import {
  init, preConnected, preRender, removeUnusedAttributes,
} from '../../scripts/components.js';

export default function createGenericBlockDef() {
  return class PLPBlock extends HTMLElement {
    constructor() {
      super();
      init(this);
    }

    // eslint-disable-next-line class-methods-use-this
    addItemToCart(item) {
      const customEvent = new CustomEvent('add_to_cart', {
        bubbles: true,
        cancelable: false,
        composed: true,
        detail: { item, rand: Math.random() },
      });
      document.querySelector('minicart-brick').dispatchEvent(customEvent);
    }

    connectedCallback() {
      preConnected();
      removeUnusedAttributes(this);
      this.shadowRoot.innerHTML += '<button id="btn-add-to-cart">Add to cart</button>';
      this.shadowRoot.querySelector('button#btn-add-to-cart').addEventListener('click', () => {
        this.addItemToCart(1234);
      });
      this.render();
    }

    render() {
      removeUnusedAttributes(this);
      preRender(this);
      // eslint-disable-next-line no-console
      console.log('prerender');
    }

    // eslint-disable-next-line class-methods-use-this
    disconnectedCallback() {
      // Cleanup any external resources or listeners
    }

    // eslint-disable-next-line no-unused-vars
    attributeChangedCallback(name, oldValue, newValue) {
      removeUnusedAttributes(this, name);
      // Respond to attribute changes
      this.render();
    }

    static get observedAttributes() {
      return ['status', 'class', 'style']; // List observed attributes here
    }
  };
}
