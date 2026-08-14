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

`generateProviderLinks` returns links in provider registry order:

```json
[
  {
    "id": "official",
    "label": "PTT 官方",
    "url": "https://www.ptt.cc/bbs/Browsers/M.1750772319.A.F2C.html"
  },
  {
    "id": "beptt",
    "label": "BePTT",
    "url": "https://bbs.beptt.tw/Browsers/M.1750772319.A.F2C"
  },
  {
    "id": "moptt",
    "label": "MoPTT",
    "url": "https://moptt.tw/p/Browsers.M.1750772319.A.F2C"
  },
  {
    "id": "pttweb",
    "label": "PTTweb",
    "url": "https://www.pttweb.cc/bbs/Browsers/M.1750772319.A.F2C"
  }
]
```

Provider support is adapter-based. Pass custom adapters to `parsePttInput` and `generateProviderLinks` to extend parsing and URL generation without changing the built-in registry.

The package is framework-free and does not access the DOM, network, or storage.
