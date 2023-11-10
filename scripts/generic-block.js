import { init, preRender } from './components.js';

export default function createBlockClass(blockName, outerHTML, classList) {
  return class GenericBlock extends HTMLElement {
    constructor() {
      super();
      init(this, { blockName, outerHTML, classList });
    }

    connectedCallback() {
      this.render();
    }

    render() {
      preRender(this);
    }

    // eslint-disable-next-line class-methods-use-this
    disconnectedCallback() {
      // Cleanup any external resources or listeners
    }

    // eslint-disable-next-line no-unused-vars
    attributeChangedCallback(name, oldValue, newValue) {
      // Respond to attribute changes
      this.render();
    }

    static get observedAttributes() {
      return []; // List observed attributes here
    }
  };
}
