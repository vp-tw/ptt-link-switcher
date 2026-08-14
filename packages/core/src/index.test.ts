import { describe, expect, expectTypeOf, it } from "vite-plus/test";

import {
  aidToArticleId,
  articleIdToAid,
  generateProviderLinks,
  parsePttInput,
  tryParsePttInput,
  type ProviderAdapter,
  type PttArticleRef,
} from "./index.js";

const article = {
  articleId: "M.1750772319.A.F2C",
  board: "Browsers",
} as const;

describe("AID conversion", () => {
  it("converts the documented full AID in both directions", () => {
    expect(aidToArticleId("#1eMgfVyi")).toBe(article.articleId);
    expect(articleIdToAid(article.articleId)).toBe("#1eMgfVyi");
  });
});

describe("parsePttInput", () => {
  it.each([
    ["Official PTT", "https://www.ptt.cc/bbs/Browsers/M.1750772319.A.F2C.html"],
    ["BePTT", "https://bbs.beptt.tw/Browsers/M.1750772319.A.F2C"],
    ["MoPTT", "https://moptt.tw/p/Browsers.M.1750772319.A.F2C"],
    ["PTTweb", "https://www.pttweb.cc/bbs/Browsers/M.1750772319.A.F2C"],
  ])("parses a %s URL", (_provider, url) => {
    const result = parsePttInput(url);
    expect(result).toMatchObject({ article, ok: true });
  });

  it("extracts a supported URL from share text", () => {
    const result = parsePttInput(
      "推薦這篇文章：https://www.ptt.cc/bbs/Browsers/M.1750772319.A.F2C.html。",
    );
    expect(result).toMatchObject({ article, ok: true });
  });

  it("asks for a board when a full AID has none", () => {
    expect(parsePttInput("#1eMgfVyi")).toEqual({
      error: {
        aid: "#1eMgfVyi",
        code: "missing_board",
        message: "Add the board name to convert this AID offline.",
      },
      ok: false,
    });
  });

  it("uses an explicitly supplied board for a full AID", () => {
    expect(parsePttInput("#1eMgfVyi", { board: "Browsers" })).toMatchObject({
      article,
      ok: true,
      source: { kind: "aid" },
    });
  });

  it("reports a malformed full AID", () => {
    expect(parsePttInput("#short")).toMatchObject({
      error: { code: "invalid_aid" },
      ok: false,
    });
  });

  it("does not mistake arbitrary text for an AID", () => {
    expect(parsePttInput("abcdefgh appears inside a sentence")).toMatchObject({
      error: { code: "unrecognized_input" },
      ok: false,
    });
  });

  it("reports an unsupported URL host", () => {
    expect(parsePttInput("https://example.com/Browsers/M.1750772319.A.F2C")).toMatchObject({
      error: { code: "unsupported_provider", host: "example.com" },
      ok: false,
    });
  });

  it("offers a nullable convenience helper", () => {
    expect(tryParsePttInput("not a PTT link")).toBeNull();
    expect(tryParsePttInput("#1eMgfVyi", { board: "Browsers" })).toEqual(article);
  });
});

describe("provider adapters", () => {
  it("generates an equivalent link for each built-in provider", () => {
    expect(generateProviderLinks(article)).toEqual([
      {
        id: "official",
        label: "PTT 官方",
        url: "https://www.ptt.cc/bbs/Browsers/M.1750772319.A.F2C.html",
      },
      {
        id: "beptt",
        label: "BePTT",
        url: "https://bbs.beptt.tw/Browsers/M.1750772319.A.F2C",
      },
      {
        id: "moptt",
        label: "MoPTT",
        url: "https://moptt.tw/p/Browsers.M.1750772319.A.F2C",
      },
      {
        id: "pttweb",
        label: "PTTweb",
        url: "https://www.pttweb.cc/bbs/Browsers/M.1750772319.A.F2C",
      },
    ]);
  });

  it("accepts a custom provider adapter without widening its id", () => {
    const customProvider = {
      hosts: ["reader.example"],
      id: "custom-reader",
      label: "Custom reader",
      parseUrl: (): PttArticleRef | null => article,
      toUrl: ({ board, articleId }: PttArticleRef): string =>
        `https://reader.example/${board}/${articleId}`,
    } satisfies ProviderAdapter<"custom-reader">;

    const links = generateProviderLinks(article, [customProvider]);
    expectTypeOf(links[0]?.id).toEqualTypeOf<"custom-reader" | undefined>();
    expect(links[0]?.url).toBe("https://reader.example/Browsers/M.1750772319.A.F2C");
  });
});
