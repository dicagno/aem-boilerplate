/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-env browser */

import { StandardElementDefs } from './components.js';

/**
 * log RUM if part of the sample.
 * @param {string} checkpoint identifies the checkpoint in funnel
 * @param {Object} data additional data for RUM sample
 * @param {string} data.source DOM node that is the source of a checkpoint event,
 * identified by #id or .classname
 * @param {string} data.target subject of the checkpoint event,
 * for instance the href of a link, or a search term
 */
function sampleRUM(checkpoint, data = {}) {
  sampleRUM.defer = sampleRUM.defer || [];
  const defer = (fnname) => {
    sampleRUM[fnname] = sampleRUM[fnname] || ((...args) => sampleRUM.defer.push({ fnname, args }));
  };
  sampleRUM.drain = sampleRUM.drain
        || ((dfnname, fn) => {
          sampleRUM[dfnname] = fn;
          sampleRUM.defer
            .filter(({ fnname }) => dfnname === fnname)
            .forEach(({ fnname, args }) => sampleRUM[fnname](...args));
        });
  sampleRUM.always = sampleRUM.always || [];
  sampleRUM.always.on = (chkpnt, fn) => {
    sampleRUM.always[chkpnt] = fn;
  };
  sampleRUM.on = (chkpnt, fn) => {
    sampleRUM.cases[chkpnt] = fn;
  };
  defer('observe');
  defer('cwv');
  try {
    window.hlx = window.hlx || {};
    if (!window.hlx.rum) {
      const usp = new URLSearchParams(window.location.search);
      const weight = usp.get('rum') === 'on' ? 1 : 100; // with parameter, weight is 1. Defaults to 100.
      const id = Array.from({ length: 75 }, (_, i) => String.fromCharCode(48 + i))
        .filter((a) => /\d|[A-Z]/i.test(a))
        .filter(() => Math.random() * 75 > 70)
        .join('');
      const random = Math.random();
      const isSelected = random * weight < 1;
      const firstReadTime = Date.now();
      const urlSanitizers = {
        full: () => window.location.href,
        origin: () => window.location.origin,
        path: () => window.location.href.replace(/\?.*$/, ''),
      };
      // eslint-disable-next-line object-curly-newline, max-len
      window.hlx.rum = {
        weight,
        id,
        random,
        isSelected,
        firstReadTime,
        sampleRUM,
        sanitizeURL: urlSanitizers[window.hlx.RUM_MASK_URL || 'path'],
      };
    }
    const { weight, id, firstReadTime } = window.hlx.rum;
    if (window.hlx && window.hlx.rum && window.hlx.rum.isSelected) {
      const knownProperties = [
        'weight',
        'id',
        'referer',
        'checkpoint',
        't',
        'source',
        'target',
        'cwv',
        'CLS',
        'FID',
        'LCP',
        'INP',
      ];
      const sendPing = (pdata = data) => {
        // eslint-disable-next-line object-curly-newline, max-len, no-use-before-define
        const body = JSON.stringify(
          {
            weight,
            id,
            referer: window.hlx.rum.sanitizeURL(),
            checkpoint,
            t: Date.now() - firstReadTime,
            ...data,
          },
          knownProperties,
        );
        const url = `https://rum.hlx.page/.rum/${weight}`;
        // eslint-disable-next-line no-unused-expressions
        navigator.sendBeacon(url, body);
        // eslint-disable-next-line no-console
        console.debug(`ping:${checkpoint}`, pdata);
      };
      sampleRUM.cases = sampleRUM.cases || {
        cwv: () => sampleRUM.cwv(data) || true,
        lazy: () => {
          // use classic script to avoid CORS issues
          const script = document.createElement('script');
          script.src = 'https://rum.hlx.page/.rum/@adobe/helix-rum-enhancer@^1/src/index.js';
          document.head.appendChild(script);
          return true;
        },
      };
      sendPing(data);
      if (sampleRUM.cases[checkpoint]) {
        sampleRUM.cases[checkpoint]();
      }
    }
    if (sampleRUM.always[checkpoint]) {
      sampleRUM.always[checkpoint](data);
    }
  } catch (error) {
    // something went wrong
  }
}

/**
 * Setup block utils.
 */
function setup() {
  window.hlx = window.hlx || {};
  window.hlx.RUM_MASK_URL = 'full';
  window.hlx.codeBasePath = '';
  window.hlx.lighthouse = new URLSearchParams(window.location.search).get('lighthouse') === 'on';

  const scriptEl = document.querySelector('script[src$="/scripts/scripts.js"]');
  if (scriptEl) {
    try {
      [window.hlx.codeBasePath] = new URL(scriptEl.src).pathname.split('/scripts/scripts.js');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }
}

/**
 * Auto initializiation.
 */

function init() {
  setup();
  sampleRUM('top');

  window.addEventListener('load', () => sampleRUM('load'));

  window.addEventListener('unhandledrejection', (event) => {
    sampleRUM('error', { source: event.reason.sourceURL, target: event.reason.line });
  });

  window.addEventListener('error', (event) => {
    sampleRUM('error', { source: event.filename, target: event.lineno });
  });
}

/**
 * Sanitizes a string for use as class name.
 * @param {string} name The unsanitized string
 * @returns {string} The class name
 */
function toClassName(name) {
  return typeof name === 'string'
    ? name
      .toLowerCase()
      .replace(/[^0-9a-z]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    : '';
}

/**
 * Sanitizes a string for use as a js property name.
 * @param {string} name The unsanitized string
 * @returns {string} The camelCased name
 */
function toCamelCase(name) {
  return toClassName(name).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Extracts the config from a block.
 * @param {Element} block The block element
 * @returns {object} The block config
 */
// eslint-disable-next-line import/prefer-default-export
function readBlockConfig(block) {
  const config = {};
  if (!block.querySelectorAll) return config;
  block.querySelectorAll(':scope > div').forEach((row) => {
    if (row.children) {
      const cols = [...row.children];
      if (cols[1]) {
        const col = cols[1];
        const name = toClassName(cols[0].textContent);
        let value = '';
        if (col.querySelector('a')) {
          const as = [...col.querySelectorAll('a')];
          if (as.length === 1) {
            value = as[0].href;
          } else {
            value = as.map((a) => a.href);
          }
        } else if (col.querySelector('img')) {
          const imgs = [...col.querySelectorAll('img')];
          if (imgs.length === 1) {
            value = imgs[0].src;
          } else {
            value = imgs.map((img) => img.src);
          }
        } else if (col.querySelector('p')) {
          const ps = [...col.querySelectorAll('p')];
          if (ps.length === 1) {
            value = ps[0].textContent;
          } else {
            value = ps.map((p) => p.textContent);
          }
        } else value = row.children[1].textContent;
        config[name] = value;
      }
    }
  });
  return config;
}

/**
 * Loads a CSS file.
 * @param {string} href URL to the CSS file
 */
async function loadCSS(href) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`head > link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.append(link);
    } else {
      resolve();
    }
  });
}

/**
 * Loads a non module JS file.
 * @param {string} src URL to the JS file
 * @param {Object} attrs additional optional attributes
 */
async function loadScript(src, attrs) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`head > script[src="${src}"]`)) {
      const script = document.createElement('script');
      script.src = src;
      if (attrs) {
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const attr in attrs) {
          script.setAttribute(attr, attrs[attr]);
        }
      }
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    } else {
      resolve();
    }
  });
}

/**
 * Retrieves the content of metadata tags.
 * @param {string} name The metadata name (or property)
 * @param {Document} doc Document object to query for metadata. Defaults to the window's document
 * @returns {string} The metadata value(s)
 */
function getMetadata(name, doc = document) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...doc.head.querySelectorAll(`meta[${attr}="${name}"]`)]
    .map((m) => m.content)
    .join(', ');
  return meta || '';
}

/**
 * Returns a picture element with webp and fallbacks
 * @param {string} src The image URL
 * @param {string} [alt] The image alternative text
 * @param {boolean} [eager] Set loading attribute to eager
 * @param {Array} [breakpoints] Breakpoints and corresponding params (eg. width)
 * @returns {Element} The picture element
 */
function createOptimizedPicture(
  src,
  alt = '',
  eager = false,
  breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }],
) {
  const url = new URL(src, window.location.href);
  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
      img.setAttribute('src', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
    }
  });

  return picture;
}

/**
 * Set template (page structure) and theme (page styles).
 */
function decorateTemplateAndTheme() {
  const addClasses = (element, classes) => {
    classes.split(',').forEach((c) => {
      element.classList.add(toClassName(c.trim()));
    });
  };
  const template = getMetadata('template');
  if (template) addClasses(document.body, template);
  const theme = getMetadata('theme');
  if (theme) addClasses(document.body, theme);
}

/**
 * Decorates paragraphs containing a single link as buttons.
 * @param {Element} element container element
 */
function decorateButtons(element) {
  element.querySelectorAll('a').forEach((a) => {
    a.title = a.title || a.textContent;
    if (a.href !== a.textContent) {
      const up = a.parentElement;
      const twoup = a.parentElement.parentElement;
      if (!a.querySelector('img')) {
        if (up.childNodes.length === 1 && (up.tagName === 'P' || up.tagName === 'DIV')) {
          a.className = 'button'; // default
          up.classList.add('button-container');
        }
        if (
          up.childNodes.length === 1
                    && up.tagName === 'STRONG'
                    && twoup.childNodes.length === 1
                    && twoup.tagName === 'P'
        ) {
          a.className = 'button primary';
          twoup.classList.add('button-container');
        }
        if (
          up.childNodes.length === 1
                    && up.tagName === 'EM'
                    && twoup.childNodes.length === 1
                    && twoup.tagName === 'P'
        ) {
          a.className = 'button secondary';
          twoup.classList.add('button-container');
        }
      }
    }
  });
}

/**
 * Add <img> for icon, prefixed with codeBasePath and optional prefix.
 * @param {span} [element] span element with icon classes
 * @param {string} [prefix] prefix to be added to icon the src
 */
function decorateIcon(span, prefix = '') {
  const iconName = Array.from(span.classList)
    .find((c) => c.startsWith('icon-'))
    .substring(5);
  const icon = document.createElement('icon');
  icon.innerHTML = iconName;
  icon.src = `${window.hlx.codeBasePath}${prefix}/icons/${iconName}.svg`;
  icon.loading = 'lazy';
  span.append(icon);
}

/**
 * Add <img> for icons, prefixed with codeBasePath and optional prefix.
 * @param {Element} [element] Element containing icons
 * @param {string} [prefix] prefix to be added to icon the src
 */
function decorateIcons(element, prefix = '') {
  const icons = [...element.querySelectorAll('span.icon')];
  icons.forEach((span) => {
    decorateIcon(span, prefix);
  });
}

/**
 * Decorates all sections in a container element.
 * @param {Element} main The container element
 */
function decorateSections(main) {
  main.querySelectorAll(':scope > div').forEach((section) => {
    const wrappers = [];
    let defaultContent = false;
    [...section.children].forEach((e) => {
      if (e.tagName === 'DIV' || !defaultContent) {
        const wrapper = document.createElement('wrapper-brick');
        wrapper.setAttribute('block-name', 'wrapper');
        wrappers.push(wrapper);
        defaultContent = e.tagName !== 'DIV';
        if (defaultContent) wrapper.setAttribute('type', 'default-content');
      }
      wrappers[wrappers.length - 1].append(e);
    });
    wrappers.forEach((wrapper) => section.append(wrapper));

    const newSection = document.createElement('section');
    newSection.innerHTML = section.innerHTML;
    newSection.setAttribute('status', 'initialized');
    newSection.style.display = 'none';
    section.replaceWith(newSection);

    // Process section metadata
    const sectionMeta = section.querySelector('section-metadata-brick');
    if (sectionMeta) {
      const meta = readBlockConfig(sectionMeta);
      Object.keys(meta).forEach((key) => {
        if (key === 'style') {
          const styles = meta.style.split(',').map((style) => toClassName(style.trim()));
          styles.forEach((style) => section.classList.add(style));
        } else {
          section.dataset[toCamelCase(key)] = meta[key];
        }
      });
      sectionMeta.remove(); // .parentNode.remove
    }
  });
}

/**
 * Gets placeholders object.
 * @param {string} [prefix] Location of placeholders
 * @returns {object} Window placeholders object
 */
// eslint-disable-next-line import/prefer-default-export
async function fetchPlaceholders(prefix = 'default') {
  window.placeholders = window.placeholders || {};
  if (!window.placeholders[prefix]) {
    window.placeholders[prefix] = new Promise((resolve) => {
      fetch(`${prefix === 'default' ? '' : prefix}/placeholders.json`)
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          return {};
        })
        .then((json) => {
          const placeholders = {};
          json.data
            .filter((placeholder) => placeholder.Key)
            .forEach((placeholder) => {
              placeholders[toCamelCase(placeholder.Key)] = placeholder.Text;
            });
          window.placeholders[prefix] = placeholders;
          resolve(window.placeholders[prefix]);
        })
        .catch(() => {
          // error loading placeholders
          window.placeholders[prefix] = {};
          resolve(window.placeholders[prefix]);
        });
    });
  }
  return window.placeholders[`${prefix}`];
}

/**
 * Updates all section status in a container element.
 * @param {Element} main The container element
 */
function updateSectionsStatus(main) {
  const sections = [...main.querySelectorAll(':scope > section')];
  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];
    const status = section.getAttribute('status');
    if (status !== 'loaded') {
      const loadingBlock = section.querySelector(
        '*:has([block-name][status="initialized"]), *:has([block-name][status="loading"])',
      );
      if (loadingBlock) {
        section.setAttribute('status', 'loading');
        break;
      } else {
        section.setAttribute('status', 'loaded');
        section.style.display = null;
      }
    }
  }
}

/**
 * Builds a block DOM Element from a two dimensional array, string, or object
 * @param {string} blockName name of the block
 * @param {*} content two dimensional array or string or object of content
 */
function buildBlock(blockName, content) {
  const table = Array.isArray(content) ? content : [[content]];
  const blockEl = document.createElement('div');
  // build image block nested div structure
  blockEl.classList.add(blockName);
  // eslint-disable-next-line no-console
  console.log('table', table);
  table.forEach((row) => {
    const rowEl = document.createElement('row-brick');
    rowEl.setAttribute('block-name', '');
    // rowEl.setAttribute('brick', '');
    row.forEach((col) => {
      const colEl = document.createElement('column-brick');
      colEl.setAttribute('block-name', '');
      // colEl.setAttribute('brick', '');
      const vals = col.elems ? col.elems : [col];
      vals.forEach((val) => {
        if (val) {
          if (typeof val === 'string') {
            colEl.innerHTML += val;
          } else {
            colEl.appendChild(val);
          }
        }
      });
      rowEl.appendChild(colEl);
    });
    blockEl.appendChild(rowEl);
  });
  return blockEl;
}

function registerStandardComponents() {
  // eslint-disable-next-line no-restricted-syntax
  for (const elementKey in StandardElementDefs) {
    if (!customElements.get(`${elementKey}-brick`)) {
      customElements.define(`${elementKey}-brick`, StandardElementDefs[elementKey]);
    }
  }
}

/**
 * Register block as a custom DOM element (web component).
 * @param {String} url The block element
 * @param {String} blockName The block element
 */
async function registerComponent(url, blockName) {
  const BlockDefClass = (await import(url)).default();
  if (!customElements.get(`${blockName}-brick`)) {
    customElements.define(`${blockName}-brick`, BlockDefClass);
  }
}

/**
 * Register block as a custom DOM element (web component).
 * @param {String} blockName name
 * @param {Element} block The block element
 */
async function registerBlockComponent(blockName, block) {
  // eslint-disable-next-line no-console
  console.log('registerBlockComponent', blockName, block);
  try {
    await registerComponent(`${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.js`, blockName);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`couldn't load brick-specific js for ${blockName}, falling back to generic brick definition`, e);
    try {
      await registerComponent(`${window.hlx.codeBasePath}/blocks/generic/generic.js`, blockName);
    } catch (ee) {
      // eslint-disable-next-line no-console
      console.error(`couldn't load brick JS definition for ${blockName}`, ee);
    }
  }
}

/**
 * Gets block name from the block element
 * @param {Element} block The block element
 */
function getBlockMetadata(block) {
  const t = block.tagName.toLowerCase();
  const blockName = t.endsWith('-brick') ? t.replace(/-brick$/g, '') : null;
  return {
    blockName,
  };
}

/**
 * Loads JS and CSS for a block.
 * @param {Element} block The block element
 */
async function loadBlock(block) {
  const status = block.getAttribute('status');
  if (status !== 'loading' && status !== 'loaded') {
    block.setAttribute('status', 'loading');
    const { blockName } = getBlockMetadata(block);
    try {
      const cssLoaded = loadCSS(`${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.css`);
      const decorationComplete = new Promise((resolve) => {
        (async () => {
          await registerBlockComponent(blockName, block);
          resolve();
        })();
      });
      await Promise.all([cssLoaded, decorationComplete]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`failed to load block ${blockName}`, error);
    }
    block.setAttribute('status', 'loaded');
  }
  return block;
}

/**
 * Loads JS and CSS for all blocks in a container element.
 * @param {Element} main The container element
 */
async function loadBlocks(main) {
  updateSectionsStatus(main);
  const blocks = [...main.querySelectorAll('[block-name]')];
  for (let i = 0; i < blocks.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await loadBlock(blocks[i]);
    updateSectionsStatus(main);
  }
}

/**
 * Builds a brick from metadata and innerHTML.
 * @param {String} name The inner HTML contents
 * @param {String} innerHTML The inner HTML contents
 * @param {DOMStringMap} dataset Set of custom attributes
 * @param {String[]} classes Applied CSS classes
 */
export function buildBrick(name, innerHTML, dataset, classes) {
  const excludedAttrs = ['name'];
  const excludedClasses = ['block', name];

  const brick = document.createElement(`${name}-brick`);
  brick.innerHTML = innerHTML;
  const filteredClasses = classes.filter((cls) => !excludedClasses.includes(cls));
  if (filteredClasses.length > 0) brick.className = filteredClasses.join(' ');
  // eslint-disable-next-line no-restricted-syntax,guard-for-in
  for (const attrKey in dataset) {
    const attrName = attrKey.replace(/^block/g, '');
    // eslint-disable-next-line no-continue
    if (!excludedAttrs.includes(attrName)) {
      brick.setAttribute(attrName, dataset[attrKey]);
    }
  }
  brick.setAttribute('block-name', name);
  return brick;
}

/**
 * Translates a block.
 * @param {Element} block The block element
 */
function translateBlock(block) {
  const blockName = block.classList[0];
  if (blockName) {
    // eslint-disable-next-line no-console
    console.log('in_block', block);
    const { dataset, classList, innerHTML } = block;
    classList.add('block');
    dataset.blockName = blockName;
    dataset.blockStatus = 'initialized';

    const brick = buildBrick(blockName, innerHTML, dataset, [...classList]);
    // eslint-disable-next-line no-console
    console.log('out_brick', brick);
    block.replaceWith(brick);
    return brick;
  }
  return null;
}

/**
 * Decorates all blocks in a container element.
 * @param {Element} main The container element
 */
// eslint-disable-next-line no-unused-vars,no-underscore-dangle
function _decorateBlocks(main) {
  main.querySelectorAll('section > wrapper-brick > div').forEach(translateBlock);
}

/**
 * Decorates all blocks in a container element by turning them into custom elements.
 * @param {Element} $main The container element
 */
function decorateBlocks($main) {
  Array.from(
    $main.querySelectorAll('section > wrapper-brick > div[class]'),
  ).forEach(($block) => {
    const blockName = $block.className;
    // $block.classList.add('block');
    $block.setAttribute('data-block-name', blockName);
    const rows = Array.from($block.querySelectorAll(':scope > div'));
    const customEl = rows.reduce(
      (cel, row) => {
        const divs = Array.from(row.querySelectorAll(':scope > div'));
        const name = divs.length === 1 ? 'value' : divs[0].textContent.toLowerCase();
        const textVal = row.querySelector(':scope > div:last-child').innerText;
        const innerHTML = row.querySelector(':scope > div:last-child > *')
              && row.querySelector(':scope > div:last-child').innerHTML;
        if (!innerHTML && rows.length === 1) {
          cel.setAttribute(name, textVal);
        } else {
          const valEl = document.createElement(`${name}-brick`);
          valEl.innerHTML = innerHTML || textVal;
          cel.appendChild(valEl);
        }
        return cel;
      },
      document.createElement(`${blockName}-brick`),
    );
    customEl.setAttribute('block-name', blockName);
    // customEl.setAttribute('brick', '');
    $block.parentElement.replaceChild(customEl, $block);
  });
}

/**
 * Loads a block named 'header' into header
 * @param {Element} header header element
 * @returns {Promise}
 */
async function loadHeader(header) {
  const headerBlock = buildBlock('header', '');
  header.append(headerBlock);
  const headerBrick = translateBlock(headerBlock);
  headerBlock.replaceWith(headerBrick);
  return loadBlock(headerBrick);
}

/**
 * Loads a block named 'footer' into footer
 * @param footer footer element
 * @returns {Promise}
 */
async function loadFooter(footer) {
  const footerBlock = buildBlock('footer', '');
  footer.append(footerBlock);
  const footerBrick = translateBlock(footerBlock);
  footerBlock.replaceWith(footerBrick);
  return loadBlock(footerBrick);
}

/**
 * Load LCP block and/or wait for LCP in default content.
 * @param {Array} lcpBlocks Array of blocks
 */
async function waitForLCP(lcpBlocks) {
  const block = document.querySelector('[block-name]');
  const hasLCPBlock = block && lcpBlocks.includes(getBlockMetadata(block).blockName);
  if (hasLCPBlock) await loadBlock(block);

  document.body.style.display = null;
  const lcpCandidate = document.querySelector('main img');

  await new Promise((resolve) => {
    if (lcpCandidate && !lcpCandidate.complete) {
      lcpCandidate.setAttribute('loading', 'eager');
      lcpCandidate.addEventListener('load', resolve);
      lcpCandidate.addEventListener('error', resolve);
    } else {
      resolve();
    }
  });
}

init();

export {
  buildBlock,
  createOptimizedPicture,
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateTemplateAndTheme,
  fetchPlaceholders,
  getMetadata,
  loadBlock,
  loadBlocks,
  loadCSS,
  loadFooter,
  loadHeader,
  loadScript,
  readBlockConfig,
  registerStandardComponents,
  sampleRUM,
  setup,
  toCamelCase,
  toClassName,
  updateSectionsStatus,
  waitForLCP,
};
