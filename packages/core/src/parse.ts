import { aidToArticleId, isValidAid } from "./aid.js";
import { providers as defaultProviders } from "./providers.js";
import type { ParseOptions, ParseResult, ProviderAdapter, PttArticleRef } from "./types.js";
import { isValidBoard, normalizeArticleRef } from "./validation.js";

const URL_PATTERN = /https?:\/\/[^\s<>"']+/giu;
const AID_INPUT_PATTERN = /^#?([0-9A-Za-z_-]{8})(?:\s*\(([^)]+)\))?$/;
const TRAILING_PUNCTUATION = /[),.!?，。！？；;：:]+$/u;

function urlsFromText(input: string): URL[] {
  const matches = input.match(URL_PATTERN) ?? [];
  const urls: URL[] = [];

  for (const match of matches) {
    try {
      urls.push(new URL(match.replace(TRAILING_PUNCTUATION, "")));
    } catch {
      // Ignore malformed URL-like fragments and continue to AID parsing.
    }
  }

  return urls;
}

function adapterForUrl(
  url: URL,
  adapters: readonly ProviderAdapter[],
): ProviderAdapter | undefined {
  const hostname = url.hostname.toLowerCase();
  return adapters.find((adapter) => adapter.hosts.includes(hostname));
}

function success(
  article: PttArticleRef,
  source:
    | { readonly kind: "aid" }
    | {
        readonly kind: "url";
        readonly providerId: string;
        readonly url: string;
      },
): ParseResult {
  return { article, ok: true, source };
}

export function parsePttInput(input: string, options: ParseOptions = {}): ParseResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return {
      error: { code: "empty_input", message: "Enter a PTT article URL or full AID." },
      ok: false,
    };
  }

  const adapters = options.providers ?? defaultProviders;
  const urls = urlsFromText(trimmed);
  let unsupportedHost: string | undefined;

  for (const url of urls) {
    const adapter = adapterForUrl(url, adapters);
    if (adapter === undefined) {
      unsupportedHost ??= url.hostname;
      continue;
    }

    const article = adapter.parseUrl(url);
    if (article !== null) {
      return success(article, {
        kind: "url",
        providerId: adapter.id,
        url: url.toString(),
      });
    }
  }

  const aidMatch = AID_INPUT_PATTERN.exec(trimmed);
  if (aidMatch?.[1] !== undefined) {
    const aid = aidMatch[1];
    if (!isValidAid(aid)) {
      return {
        error: { code: "invalid_aid", message: "The AID must contain exactly 8 characters." },
        ok: false,
      };
    }

    const board = (aidMatch[2] ?? options.board)?.trim();
    if (board === undefined || board.length === 0) {
      return {
        error: {
          aid: `#${aid}`,
          code: "missing_board",
          message: "Add the board name to convert this AID offline.",
        },
        ok: false,
      };
    }

    if (!isValidBoard(board)) {
      return {
        error: { code: "invalid_aid", message: "The board name is not valid." },
        ok: false,
      };
    }

    const articleId = aidToArticleId(aid);
    const article = articleId === null ? null : normalizeArticleRef(board, articleId);
    if (article !== null) return success(article, { kind: "aid" });
  }

  if (trimmed.startsWith("#")) {
    return {
      error: {
        code: "invalid_aid",
        message: "The AID must contain exactly 8 supported characters.",
      },
      ok: false,
    };
  }

  if (unsupportedHost !== undefined) {
    return {
      error: {
        code: "unsupported_provider",
        host: unsupportedHost,
        message: `Unsupported PTT reader: ${unsupportedHost}`,
      },
      ok: false,
    };
  }

  return {
    error: {
      code: "unrecognized_input",
      message: "No supported PTT article URL or full AID was found.",
    },
    ok: false,
  };
}

export function tryParsePttInput(input: string, options?: ParseOptions): PttArticleRef | null {
  const result = parsePttInput(input, options);
  return result.ok ? result.article : null;
}
