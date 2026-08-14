# PTT Link Switcher

在支援的閱讀站之間解析並轉換 PTT 文章連結，全程離線完成。

PTT Link Switcher 是純前端應用程式，也是無框架相依的 TypeScript 函式庫。它會將支援的閱讀站網址、分享文字或完整 AID 轉成統一的文章參照，再為每個閱讀站產生對應網址。

## 功能

- 解析 PTT 官方、BePTT、MoPTT 與 PTTweb 的文章網址。
- 從分享文字擷取支援的網址。
- 轉換 `#1eMgfVyi` 等完整 AID；若輸入未包含看板，需另外提供看板名稱。
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

## 環境需求

- Node.js 24.19.0
- 透過 Corepack 使用 pnpm 11.21.0

```sh
corepack pnpm install
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
```

在本機啟動網頁：

```sh
corepack pnpm --filter @vp-tw/ptt-link-switcher-web dev
```

## 函式庫用法

```ts
import { generateProviderLinks, parsePttInput } from "@vp-tw/ptt-link-switcher";

const result = parsePttInput("https://www.ptt.cc/bbs/Browsers/M.1750772319.A.F2C.html");

if (result.ok) {
  console.log(result.article);
  console.log(generateProviderLinks(result.article));
}
```

完整 AID 不包含看板名稱，因此離線轉換時必須明確提供：

```ts
parsePttInput("#1eMgfVyi", { board: "Browsers" });
```

## 隱私邊界

核心套件只執行可預期的字串轉換，不依賴 DOM、網路或儲存空間。網頁會將閱讀站偏好儲存在本機，並透過 URL query string 保存目前輸入。文章中繼資料不在這個 POC 的範圍內。

## 發布流程

Changesets 會記錄套件變更並建立 release PR。合併 release PR 後，流程會發布附帶來源證明的公開 npm 套件，並建立對應的 GitHub release。

## 授權條款

[MIT](./LICENSE)
