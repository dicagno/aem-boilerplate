import {
  init, preConnected, preRender, removeUnusedAttributes,
} from '../../scripts/components.js';

export default function createGenericBlockDef() {
  return class GenericBlock extends HTMLElement {
    constructor() {
      super();
      init(this);
    }

    connectedCallback() {
      preConnected();
      removeUnusedAttributes(this);
      this.render();
    }

    render() {
      removeUnusedAttributes(this);
      preRender(this);
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
