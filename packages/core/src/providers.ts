import type { ProviderAdapter, ProviderId, ProviderLink, PttArticleRef, PttUrl } from "./types.js";
import { normalizeArticleRef } from "./validation.js";

function decodePathPart(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function parsePttStylePath(pathname: string): PttArticleRef | null {
  const match = /^\/bbs\/([^/]+)\/((?:M|G)\.\d+\.A(?:\.[0-9A-Fa-f]{3})?)(?:\.html)?\/?$/.exec(
    pathname,
  );
  if (!match || match[1] === undefined || match[2] === undefined) return null;
  const board = decodePathPart(match[1]);
  return board === null ? null : normalizeArticleRef(board, match[2]);
}

function defineProvider<TId extends ProviderId>(
  provider: ProviderAdapter<TId>,
): ProviderAdapter<TId> {
  return Object.freeze(provider);
}

export const officialProvider: ProviderAdapter<"official"> = defineProvider({
  hosts: ["www.ptt.cc", "ptt.cc"],
  id: "official",
  label: "PTT 官方",
  parseUrl: (url: PttUrl): PttArticleRef | null => parsePttStylePath(url.pathname),
  toUrl: (article: PttArticleRef): string =>
    `https://www.ptt.cc/bbs/${encodeURIComponent(article.board)}/${article.articleId}.html`,
});

export const bepttProvider: ProviderAdapter<"beptt"> = defineProvider({
  hosts: ["bbs.beptt.tw", "bbs.beptt.cc"],
  id: "beptt",
  label: "BePTT",
  parseUrl: (url: PttUrl): PttArticleRef | null => {
    const match = /^\/([^/]+)\/((?:M|G)\.\d+\.A(?:\.[0-9A-Fa-f]{3})?)\/?$/.exec(url.pathname);
    if (!match || match[1] === undefined || match[2] === undefined) return null;
    const board = decodePathPart(match[1]);
    return board === null ? null : normalizeArticleRef(board, match[2]);
  },
  toUrl: (article: PttArticleRef): string =>
    `https://bbs.beptt.tw/${encodeURIComponent(article.board)}/${article.articleId}`,
});

export const mopttProvider: ProviderAdapter<"moptt"> = defineProvider({
  hosts: ["moptt.tw", "www.moptt.tw"],
  id: "moptt",
  label: "MoPTT",
  parseUrl: (url: PttUrl): PttArticleRef | null => {
    const match = /^\/p\/(.+?)\.((?:M|G)\.\d+\.A(?:\.[0-9A-Fa-f]{3})?)\/?$/.exec(url.pathname);
    if (!match || match[1] === undefined || match[2] === undefined) return null;
    const board = decodePathPart(match[1]);
    return board === null ? null : normalizeArticleRef(board, match[2]);
  },
  toUrl: (article: PttArticleRef): string =>
    `https://moptt.tw/p/${encodeURIComponent(article.board)}.${article.articleId}`,
});

export const pttwebProvider: ProviderAdapter<"pttweb"> = defineProvider({
  hosts: ["www.pttweb.cc", "pttweb.cc"],
  id: "pttweb",
  label: "PTTweb",
  parseUrl: (url: PttUrl): PttArticleRef | null => parsePttStylePath(url.pathname),
  toUrl: (article: PttArticleRef): string =>
    `https://www.pttweb.cc/bbs/${encodeURIComponent(article.board)}/${article.articleId}`,
});

export const providers: readonly [
  ProviderAdapter<"official">,
  ProviderAdapter<"beptt">,
  ProviderAdapter<"moptt">,
  ProviderAdapter<"pttweb">,
] = Object.freeze([officialProvider, bepttProvider, mopttProvider, pttwebProvider] as const);

export function getProvider<TAdapter extends ProviderAdapter>(
  adapters: readonly TAdapter[],
  id: string,
): TAdapter | undefined {
  return adapters.find((adapter) => adapter.id === id);
}

export function generateProviderLinks(article: PttArticleRef): ProviderLink<ProviderId>[];
export function generateProviderLinks<TAdapter extends ProviderAdapter>(
  article: PttArticleRef,
  adapters: readonly TAdapter[],
): ProviderLink<TAdapter["id"]>[];
export function generateProviderLinks(
  article: PttArticleRef,
  adapters: readonly ProviderAdapter[] = providers,
): ProviderLink[] {
  return adapters.map((adapter) => ({
    id: adapter.id,
    label: adapter.label,
    url: adapter.toUrl(article),
  }));
}
