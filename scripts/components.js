/* eslint-disable max-classes-per-file */

// eslint-disable-next-line no-unused-vars
export function preRender($this) {
}

export function removeUnusedAttributes($this, name) {
  const skippedAttrs = ['brick'];
  if (name) {
    if (name === 'class') {
      if ($this.className === '') $this.removeAttribute('class');
    } else if (name === 'style') {
      if ($this.getAttribute('style') === '') $this.removeAttribute('style');
    }
  } else {
    // eslint-disable-next-line no-restricted-syntax
    for (const attrName of $this.getAttributeNames()) {
      if (!skippedAttrs.includes(attrName) && $this.getAttribute(attrName) === '') $this.removeAttribute(attrName);
    }
  }
}

export function preConnected() {

}

export function init($this) {
  if (!$this.shadowRoot) {
    $this.attachShadow({ mode: 'open' });
  } else {
    // eslint-disable-next-line no-console
    console.warn(`shadowRoot already attached for ${$this.tagName}`);
  }
}

// eslint-disable-next-line max-classes-per-file
class SubBlock extends HTMLElement {
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();
    init(this);
    this.allowedParents = [/-brick$/g];
  }

  connectedCallback() {
    this.performPreflightChecks();
  }

  appendChild(node) {
    this.shadowRoot.appendChild(node);
  }

  set innerHTML(content) {
    // eslint-disable-next-line no-console
    console.log('content', content);
    // Manipulate shadow root's innerHTML
    this.shadowRoot.innerHTML = `<div>${content}</div>`;
  }

  checkParent() {
    if (!this.parentElement) return false;
    const parentTag = this.parentElement.tagName.toLowerCase();
    return this.allowedParents.some((regex) => regex.test(parentTag));
  }

  performPreflightChecks() {
    const isParenthoodChecked = this.checkParent();
    if (!isParenthoodChecked) {
      // eslint-disable-next-line no-console
      if (!this.parentElement) {
        // eslint-disable-next-line no-console
        console.error('no ancestor found');
      } else {
        // eslint-disable-next-line no-console
        console.error(`${this.tagName} has a wrong ancestor: ${this.parentElement.tagName}, allowed: ${this.allowedParents.map((e) => e.toString()).join(',')}`);
      }
    }
  }
}

class Row extends SubBlock {
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();
    this.allowedParents = [/^column-brick$/g, /-brick$/g];
  }
}

class Column extends SubBlock {
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();
    this.allowedParents = [/^row-brick$/g, /-brick$/g];
  }
}

class Wrapper extends SubBlock {
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();
    this.allowedParents = [/^section$/g, /-brick$/g];
  }
}

class SectionMetadata extends HTMLElement {
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
  }
}

export const StandardElementDefs = {
  row: Row,
  column: Column,
  wrapper: Wrapper,
  'section-metadata': SectionMetadata,
};

class ContentWrapperComponent extends HTMLElement {
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
  }
}

export class DefaultContentWrapper extends ContentWrapperComponent {

}
