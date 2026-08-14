# PTT Link Switcher

Parse and convert PTT article links across supported readers—entirely offline.

PTT Link Switcher is a pure-frontend app and framework-free TypeScript library. It turns a supported reader URL, shared text, or full AID into one canonical article reference, then generates the equivalent URL for every reader.

## Features

- Parses Official PTT, BePTT, MoPTT, and PTTweb article URLs.
- Extracts supported URLs from shared text.
- Converts full AIDs such as `#1eMgfVyi`; supply the board when it is absent.
- Generates reader URLs through declarative provider adapters.
- Updates conversions automatically after a short input debounce.
- Supports drag-and-drop reader ordering with touch-safe move controls.
- Keeps core conversion offline with no DOM, fetch, or storage access.
- Persists reader ordering, visibility, and the default reader in the web app.

## Workspace

| Path            | Purpose                                                     |
| --------------- | ----------------------------------------------------------- |
| `packages/core` | Framework-free parser, AID converter, and provider adapters |
| `apps/web`      | Svelte 5 and Vite+ web app for GitHub Pages                 |

## Requirements

- Node.js 24.19.0
- pnpm 11.21.0 through Corepack

```sh
corepack pnpm install
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
```

Run the web app locally:

```sh
corepack pnpm --filter @vp-tw/ptt-link-switcher-web dev
```

## Library usage

```ts
import { generateProviderLinks, parsePttInput } from "@vp-tw/ptt-link-switcher";

const result = parsePttInput("https://www.ptt.cc/bbs/Browsers/M.1750772319.A.F2C.html");

if (result.ok) {
  console.log(result.article);
  console.log(generateProviderLinks(result.article));
}
```

Full AIDs do not contain a board name, so offline conversion needs one explicitly:

```ts
parsePttInput("#1eMgfVyi", { board: "Browsers" });
```

## Privacy boundary

The core package performs deterministic string conversion only. It has no DOM, network, or storage dependency. The web app stores reader preferences locally and uses the URL query string for the current input. Article metadata is outside this POC.

## Release

Changesets records package changes and drives the release pull request. Merging a release pull request publishes the public npm package with provenance and creates the corresponding GitHub release.

## License

[MIT](./LICENSE)
