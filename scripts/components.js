export function preRender($this) {
  $this.shadowRoot.innerHTML = $this.initHTML;
}

export function init($this, { blockName, outerHTML, classList }) {
  const classes = [...classList];
  $this.attachShadow({ mode: 'open' });
  $this.initHTML = outerHTML;
  $this.blockName = blockName;
  $this.shadowRoot.className = (classes && classes.length > 0) ? classes.join(' ') : '';
}
