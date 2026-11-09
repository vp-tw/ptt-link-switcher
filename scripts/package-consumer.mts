import {
  generateProviderLinks,
  parsePttInput,
  type ProviderAdapter,
} from "@vp-tw/ptt-link-switcher";

const article = { board: "Gossiping", articleId: "M.1771671779.A.6ED" };
const officialUrl = "https://www.ptt.cc/bbs/Gossiping/M.1771671779.A.6ED.html";
const result = parsePttInput("#1fcP3ZRj", { board: article.board });
if (
  !result.ok ||
  result.article.board !== article.board ||
  result.article.articleId !== article.articleId ||
  generateProviderLinks(result.article)[0]?.url !== officialUrl
) {
  throw new Error("The installed ESM package failed to convert the example.");
}

const adapter = {
  hosts: ["reader.example"],
  id: "smoke",
  label: "Smoke test reader",
  parseUrl: (url) => (url.pathname === "/article" ? article : null),
  toUrl: () => "https://reader.example/article",
} satisfies ProviderAdapter<"smoke">;
const custom = parsePttInput(adapter.toUrl(), { providers: [adapter] });
if (!custom.ok) throw new Error("The installed package rejected a custom provider.");
const link = generateProviderLinks(custom.article, [adapter])[0];
const id: "smoke" = link.id;
if (id !== "smoke" || link.url !== adapter.toUrl()) {
  throw new Error("The installed package returned an unexpected custom reader link.");
}
