# Project Bricks

<img src="https://github.com/dicagno/aem-boilerplate/assets/5924009/e7498e91-3196-4049-9463-1f816badf3ab" width="256" />

## Intro

Web Components is a Web Platform standard designed for creating reusable elements with custom styling and logic and configurable degree of isolation (see Shadow DOM) to prevent interferences and side effects between the component and the surrounding elements and DOM tree.

This sounds pretty much similar to the purpose of Blocks in AEM: so far, they are pieces of reusable code using "standard" DOM elements.

### Key advantages:

- an industry-standards based foundation for enabling complex functionality in Content & Commerce projects (e.g. drop-ins) without sacrificing performance, for component-based development, with all the associated benefits (reusability, encapsulation, ...)
- top performance (LHS 100) is preserved thanks to 100% browser-native primitives and APIs
- fallback to a defined standard Web Component in case no definition is in place for the specific block
- component isolation is possible (not mandatory) thanks to the Shadow DOM
- more consistency in global styling (the tag name can be referenced, i.e. block-hero {}
- much easier to reuse blocks in standard HTML (i.e. reusing hero block in 404) or even fragments (which might contain custom elements in their body)
- clean code is favored with this approach, for example a class defines a block 1:1 in behaviour and attributes (data)
- easier to debug in page inspector (browser)

- auto-sensing components are able to throw errors or warnings if set as children of incompatible parent components (ex.: a row as a child of another row)

- easier to redistribute block code, which is effectively encapsulated

## Goals

This project explores the usage of Web Components as "first-class citizens" in Edge Delivery projects, by focusing on specific use cases where they bring the most value.

In summary, with the following project, our team is delivering a POC of the envisioned approach, refactoring the boilerplate and without altering the authoring experience, but proposing a new, flawless developer experience. From the customer's perspective, as said, our aim is to keep LHS 100, considering performance as the main factor (and acceptance criteria) for this approach to succeed.

## Environments
- Preview: https://aem-bricks-preview.albertodicagno.com/
- Live: https://aem-bricks.albertodicagno.com/

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `aem-boilerplate` template and add a mountpoint in the `fstab.yaml`
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/aem-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `npm start` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)
