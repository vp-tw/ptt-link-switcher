# @vp-tw/ptt-link-switcher

Parse and convert PTT article links across supported readers—entirely offline.

```ts
import { generateProviderLinks, parsePttInput } from "@vp-tw/ptt-link-switcher";

const result = parsePttInput("#1eMgfVyi", { board: "Browsers" });

if (result.ok) {
  const links = generateProviderLinks(result.article);
  console.log(links);
}
```

Provider support is adapter-based. Pass custom adapters to `parsePttInput` and `generateProviderLinks` to extend parsing and URL generation without changing the built-in registry.

The package is framework-free and does not access the DOM, network, or storage.
