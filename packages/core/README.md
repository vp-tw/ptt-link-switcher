# @vp-tw/ptt-link-switcher

Parse and convert PTT article links across supported readers—entirely offline.

```ts
import { generateProviderLinks, parsePttInput } from "@vp-tw/ptt-link-switcher";

const result = parsePttInput("#1fcP3ZRj", { board: "Gossiping" });

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
    "url": "https://www.ptt.cc/bbs/Gossiping/M.1771671779.A.6ED.html"
  },
  {
    "id": "beptt",
    "label": "BePTT",
    "url": "https://bbs.beptt.tw/Gossiping/M.1771671779.A.6ED"
  },
  {
    "id": "pttweb",
    "label": "PTTweb",
    "url": "https://www.pttweb.cc/bbs/Gossiping/M.1771671779.A.6ED"
  },
  {
    "id": "moptt",
    "label": "MoPTT",
    "url": "https://moptt.tw/p/Gossiping.M.1771671779.A.6ED"
  },
  {
    "id": "nextptt",
    "label": "NextPTT",
    "url": "https://nextptt.app/boards/Gossiping/post/M.1771671779.A.6ED"
  }
]
```

The built-in order is Official PTT, BePTT, PTTweb, MoPTT, and NextPTT. This is a default ordering, not a guarantee of social-platform preview compatibility.

Provider support is adapter-based. Pass custom adapters to `parsePttInput` and `generateProviderLinks` to extend parsing and URL generation without changing the built-in registry.

The package is framework-free and does not access the DOM, network, or storage.
