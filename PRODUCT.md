# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Svelte and TypeScript in a pnpm monorepo. The reusable core remains framework-free. Tooling should prefer current stable releases of Node.js, pnpm, Vite, Rolldown, tsdown, and related tools when they form a verified, maintainable integration; prerelease tooling is permitted only when the official integration path is complete and CI verifies it.

## Users

PTT readers who receive article links for different reader services and want to continue in their preferred reader without manually reconstructing the URL.

## Product Purpose

PTT Link Switcher parses PTT article URLs and full AID input into a canonical article reference, then generates equivalent links for every supported reader. Success means the conversion is immediate, understandable, and usable without a network request.

## Positioning

One offline conversion model connects Official PTT, BePTT, MoPTT, and PTTweb while keeping reader definitions independently maintainable and reusable outside the web app.

## Operating Context

Users may paste a direct URL, share text containing a URL, or a full AID such as `#1eMgfVyi (Browsers)`. They copy a generated link or open it in a selected reader. Browser preferences retain provider order, visibility, and the default reader.

## Capabilities and Constraints

- Parse supported inputs into `PttArticleRef { board, articleId }`.
- Return structured parse outcomes and offer a nullable convenience helper.
- Require a board when an AID omits its `(board)` suffix; never resolve it over the network.
- Define providers through extensible adapters that own recognition, parsing, URL generation, labels, icons, and ordering metadata.
- Generate, copy, and open one provider link at a time.
- Keep `packages/core` free of frameworks, DOM APIs, fetch, and storage.
- Keep browser persistence and reactive query-string state in `apps/web`.
- Cache the web app for offline use and ask before reloading into a ready update.
- Keep article metadata outside the proof of concept.
- Support current evergreen browsers without legacy-browser polyfills or excessive compatibility work.
- Bundle provider icons and record their provenance. Consistent original artwork may replace official marks.

## Brand Commitments

- Product name: PTT Link Switcher.
- Voice: concise, direct, and useful to Traditional Chinese readers.
- The web surface should feel like a designed marketing product while keeping the conversion task primary.
- Use one fixed theme. Do not add a light/dark mode switch.
- The footer links to the public `vp-tw/ptt-link-switcher` GitHub repository.

## Evidence on Hand

There are no testimonials, usage metrics, customer claims, or existing brand assets. Future work must not fabricate them. The product mechanism itself is the primary demonstration.

## Product Principles

- Conversion remains offline and deterministic.
- The canonical article reference is the boundary between parsing and URL generation.
- Provider support stays easy to inspect, test, maintain, and extend.
- The first interaction explains the product by performing the conversion.
- Preferences improve repeat use without entering the reusable core.

## Accessibility & Inclusion

The web app uses semantic controls, complete keyboard operation, visible focus states, sufficient contrast, and reduced-motion behavior. The primary UI language is Traditional Chinese; technical documentation is English.
