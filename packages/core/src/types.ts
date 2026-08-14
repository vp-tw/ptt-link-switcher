export interface PttArticleRef {
  readonly board: string;
  readonly articleId: string;
}

export type ProviderId = "official" | "beptt" | "moptt" | "pttweb";

export interface PttUrl {
  readonly hostname: string;
  readonly pathname: string;
  readonly toString: () => string;
}

export interface ProviderAdapter<TId extends string = string> {
  readonly id: TId;
  readonly label: string;
  readonly hosts: readonly string[];
  readonly parseUrl: (url: PttUrl) => PttArticleRef | null;
  readonly toUrl: (article: PttArticleRef) => string;
}

export type ParseSource =
  | { readonly kind: "aid" }
  | { readonly kind: "url"; readonly providerId: string; readonly url: string };

export type ParseError =
  | { readonly code: "empty_input"; readonly message: string }
  | { readonly code: "invalid_aid"; readonly message: string }
  | {
      readonly aid: string;
      readonly code: "missing_board";
      readonly message: string;
    }
  | {
      readonly code: "unsupported_provider";
      readonly host: string;
      readonly message: string;
    }
  | { readonly code: "unrecognized_input"; readonly message: string };

export type ParseResult =
  | {
      readonly article: PttArticleRef;
      readonly ok: true;
      readonly source: ParseSource;
    }
  | { readonly error: ParseError; readonly ok: false };

export interface ParseOptions {
  readonly board?: string;
  readonly providers?: readonly ProviderAdapter[];
}

export interface ProviderLink<TId extends string = string> {
  readonly id: TId;
  readonly label: string;
  readonly url: string;
}
