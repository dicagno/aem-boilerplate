import {
  init, preConnected, preRender, removeUnusedAttributes,
} from '../../scripts/components.js';

export default function createGenericBlockDef() {
  return class MinicartBlock extends HTMLElement {
    constructor() {
      super();
      init(this);
    }

    addItem(item) {
      this.shadowRoot.querySelector('span#items-display').innerHTML = JSON.stringify(item);
    }

    connectedCallback() {
      preConnected();
      removeUnusedAttributes(this);
      this.addEventListener('add_to_cart', (e) => {
        // eslint-disable-next-line no-console
        console.log('got add_to_cart event', e);
        this.addItem(e.detail);
      });
      this.shadowRoot.innerHTML = '<span id="items-display">ITEMS_DISPLAY_PLACEHOLDER</span>';
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
