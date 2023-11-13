// eslint-disable-next-line max-classes-per-file
class SubBlock extends HTMLElement {
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();
    this.allowedParents = [/^block-/g];
  }

  hasAllowedParents() {
    const parentTag = this.parentElement.tagName.toLowerCase();
    // eslint-disable-next-line no-restricted-syntax
    for (const allowedParent of this.allowedParents) {
      if (allowedParent.test(parentTag)) return true;
    }
    return false;
  }

  performPreflightChecks() {
    const isParenthoodChecked = this.hasAllowedParents();
    if (!isParenthoodChecked) {
      // eslint-disable-next-line no-console
      console.error(`${this.tagName} has wrong parenthood`);
    }
  }
}

class Row extends SubBlock {
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();
    this.allowedParents = [/^block-column$/g, /^block-/g];
  }
}

class Column extends SubBlock {
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();
    this.allowedParents = [/^block-row$/g, /^block-/g];
  }

  render() {
    this.performPreflightChecks();
  }
}

class Wrapper extends SubBlock {
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();
    this.allowedParents = [/^block-row$/g, /^block-/g];
  }

  render() {
    this.performPreflightChecks();
  }
}

export const StandardElementDefs = {
  row: Row,
  column: Column,
  wrapper: Wrapper,
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

// eslint-disable-next-line no-unused-vars
export function preRender($this) {
}

export function removeUnusedAttributes($this, name) {
  if (name) {
    if (name === 'class') {
      if ($this.className === '') $this.removeAttribute('class');
    } else if (name === 'style') {
      if ($this.getAttribute('style') === '') $this.removeAttribute('style');
    }
  } else {
    // eslint-disable-next-line no-restricted-syntax
    for (const attrName of $this.getAttributeNames()) {
      if ($this.getAttribute(attrName) === '') $this.removeAttribute(attrName);
    }
  }
}

export function preConnected() {

}

export function init($this) {
  $this.attachShadow({ mode: 'open' });
}
