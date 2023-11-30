import {
  init, preConnected, preRender, removeUnusedAttributes,
} from '../../scripts/components.js';
import { getMetadata, decorateIcons } from '../../scripts/aem.js';

export default function createGenericBlockDef() {
  return class HeaderBrick extends HTMLElement {
    constructor() {
      super();
      init(this);
      const slot = document.createElement('slot');
      this.shadowRoot.appendChild(slot);
      this.expanded = undefined;
      this.isDesktop = window.matchMedia('(min-width: 900px)');
    }

    async connectedCallback() {
      preConnected();
      removeUnusedAttributes(this);
      await this.render();
    }

    closeOnEscape(e) {
      if (e.code === 'Escape') {
        const nav = document.getElementById('nav');
        const navSections = nav.querySelector('.nav-sections');
        const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
        if (navSectionExpanded && this.isDesktop.matches) {
          // eslint-disable-next-line no-use-before-define
          this.toggleAllNavSections(navSections);
          navSectionExpanded.focus();
        } else if (!this.isDesktop.matches) {
          // eslint-disable-next-line no-use-before-define
          this.toggleMenu(nav, navSections);
          nav.querySelector('button').focus();
        }
      }
    }

    openOnKeydown(e) {
      const focused = document.activeElement;
      const isNavDrop = focused.className === 'nav-drop';
      if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
        const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
        // eslint-disable-next-line no-use-before-define
        this.toggleAllNavSections(focused.closest('.nav-sections'));
        focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
      }
    }

    /**
     * Toggles all nav sections
     * @param {Element} sections The container element
     * @param {Boolean} expanded Whether the element should be expanded or collapsed
     */
    // eslint-disable-next-line class-methods-use-this
    toggleAllNavSections(sections, expanded = false) {
      sections.querySelectorAll('.nav-sections > ul > li').forEach((section) => {
        section.setAttribute('aria-expanded', expanded.toString());
      });
    }

    /**
     * Toggles the entire nav
     * @param {Element} nav The container element
     * @param {Element} navSections The nav sections within the container element
     * @param {*} forceExpanded Optional param to force nav expand behavior when not null
     */
    toggleMenu(nav, navSections, forceExpanded = null) {
      // eslint-disable-next-line max-len
      const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
      const button = nav.querySelector('.nav-hamburger button');
      document.body.style.overflowY = (expanded || this.isDesktop.matches) ? '' : 'hidden';
      nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      this.toggleAllNavSections(navSections, this.expanded || this.isDesktop.matches);
      button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
      // enable nav dropdown keyboard accessibility
      const navDrops = navSections.querySelectorAll('.nav-drop');
      if (this.isDesktop.matches) {
        navDrops.forEach((drop) => {
          if (!drop.hasAttribute('tabindex')) {
            drop.setAttribute('role', 'button');
            drop.setAttribute('tabindex', 0);
            drop.addEventListener('focus', this.focusNavSection);
          }
        });
      } else {
        navDrops.forEach((drop) => {
          drop.removeAttribute('role');
          drop.removeAttribute('tabindex');
          drop.removeEventListener('focus', this.focusNavSection);
        });
      }
      // enable menu collapse on escape keypress
      if (!expanded || this.isDesktop.matches) {
        // collapse menu on escape press
        window.addEventListener('keydown', this.closeOnEscape);
      } else {
        window.removeEventListener('keydown', this.closeOnEscape);
      }
    }

    focusNavSection() {
      const $this = this;
      document.activeElement.addEventListener('keydown', $this.openOnKeydown);
    }

    async render() {
      removeUnusedAttributes(this);
      preRender(this);
      this.isDesktop = window.matchMedia('(min-width: 900px)');

      const block = this.shadowRoot;
      // fetch nav content
      const navMeta = getMetadata('nav');
      const navPath = navMeta ? new URL(navMeta).pathname : '/nav';
      const resp = await fetch(`${navPath}.plain.html`);

      if (resp.ok) {
        const html = await resp.text();

        // decorate nav DOM
        const nav = document.createElement('nav');
        nav.id = 'nav';
        nav.innerHTML = html;

        const classes = ['brand', 'sections', 'tools'];
        classes.forEach((c, i) => {
          const section = nav.children[i];
          if (section) section.classList.add(`nav-${c}`);
        });

        const navSections = nav.querySelector('.nav-sections');
        if (navSections) {
          navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
            if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
            navSection.addEventListener('click', () => {
              if (this.isDesktop.matches) {
                const expanded = navSection.getAttribute('aria-expanded') === 'true';
                this.toggleAllNavSections(navSections);
                navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
              }
            });
          });
        }

        // hamburger for mobile
        const hamburger = document.createElement('div');
        hamburger.classList.add('nav-hamburger');
        // eslint-disable-next-line max-len
        hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
        <span class="nav-hamburger-icon"></span>
      </button>`;
        hamburger.addEventListener('click', () => this.toggleMenu(nav, navSections));
        nav.prepend(hamburger);
        nav.setAttribute('aria-expanded', 'false');
        // prevent mobile nav behavior on window resize
        this.toggleMenu(nav, navSections, this.isDesktop.matches);
        this.isDesktop.addEventListener('change', () => this.toggleMenu(nav, navSections, this.isDesktop.matches));

        decorateIcons(nav);
        const navWrapper = document.createElement('div');
        navWrapper.className = 'nav-wrapper';
        navWrapper.append(nav);
        block.append(navWrapper);
      }
    }

    // eslint-disable-next-line class-methods-use-this
    disconnectedCallback() {
      // Cleanup any external resources or listeners
    }

    // eslint-disable-next-line no-unused-vars
    async attributeChangedCallback(name, oldValue, newValue) {
      removeUnusedAttributes(this, name);
      // Respond to attribute changes
      await this.render();
    }

    static get observedAttributes() {
      return ['status', 'class', 'style']; // List observed attributes here
    }
  };
}
