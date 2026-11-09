# PTT Link Switcher

在支援的閱讀站之間解析並轉換 PTT 文章連結，全程離線完成。

PTT Link Switcher 是純前端應用程式，也是無框架相依的 TypeScript 函式庫。它會將支援的閱讀站網址、分享文字或完整 AID 轉成統一的文章參照，再為每個閱讀站產生對應網址。

## 功能

- 解析 PTT 官方、BePTT、PTTweb、MoPTT 與 NextPTT 的文章網址。
- 從分享文字擷取支援的網址。
- 轉換 `#1fcP3ZRj` 等完整 AID；若輸入未包含看板，需另外提供看板名稱。
- 透過宣告式 provider adapter（閱讀站轉接器）產生各閱讀站網址。
- 輸入停止片刻後自動更新轉換結果。
- 可安裝為離線 PWA，並在套用新版前詢問使用者。
- 支援拖放調整閱讀站順序，觸控裝置另提供安全的移動控制。
- 核心轉換全程離線，不使用 DOM、fetch 或儲存空間。
- 網頁會保留閱讀站順序、顯示狀態與預設閱讀站。

## 工作區

| 路徑            | 用途                                               |
| --------------- | -------------------------------------------------- |
| `packages/core` | 無框架相依的解析器、AID 轉換器與 provider adapters |
| `apps/web`      | 部署至 GitHub Pages 的 Svelte 5 與 Vite+ 網頁      |

## Development

Install [mise](https://mise.jdx.dev/getting-started.html), then install the project tools:

```sh
mise install node pnpm
```

mise reads Node.js 24.19.0 from `.node-version` and pnpm 11.21.0 from `package.json`.
`mise.lock` records verified downloads for Linux x64 and macOS arm64. GitHub Actions
uses these locked tools for validation, deployment, and releases.

Run commands through mise without changing your shell configuration:

```sh
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm test
mise exec -- pnpm typecheck
mise exec -- pnpm build
```

Start the web app:

```sh
mise exec -- pnpm --filter @vp-tw/ptt-link-switcher-web dev
```

If mise is already activated in your shell, you can run `pnpm` directly.

## 函式庫用法

```ts
import { generateProviderLinks, parsePttInput } from "@vp-tw/ptt-link-switcher";

const result = parsePttInput("https://www.ptt.cc/bbs/Gossiping/M.1771671779.A.6ED.html");

if (result.ok) {
  console.log(result.article);
  const links = generateProviderLinks(result.article);
  console.log(links);
}
```

`generateProviderLinks` 會依 provider registry 的順序回傳可用網址：

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

完整 AID 不包含看板名稱，因此離線轉換時必須明確提供：

```ts
parsePttInput("#1fcP3ZRj", { board: "Gossiping" });
```

## 隱私邊界

核心套件只執行可預期的字串轉換，不依賴 DOM、網路或儲存空間。網頁會在本機保存閱讀站偏好，並將轉換成功的 PTT 官方文章網址寫入頁面網址，方便分享及重新開啟。轉換僅處理文章識別資訊與網址，不會查詢文章標題或內容，也不會檢查各閱讀站是否收錄該篇文章。

## 發布流程

Changesets 會記錄套件變更並建立 release PR。合併 release PR 後，流程會發布附帶來源證明的公開 npm 套件，並建立對應的 GitHub release。

## 授權條款

[MIT](./LICENSE)
