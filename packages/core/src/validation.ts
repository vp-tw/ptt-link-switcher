import type { PttArticleRef } from "./types.js";

const BOARD_PATTERN = /^[A-Za-z0-9_.-]+$/;
const ARTICLE_ID_PATTERN = /^(M|G)\.\d+\.A(?:\.[0-9A-F]{3})?$/;

export function normalizeArticleRef(board: string, articleId: string): PttArticleRef | null {
  const normalizedBoard = board.trim();
  const normalizedArticleId = articleId.trim().toUpperCase();

  if (
    normalizedBoard.length === 0 ||
    normalizedBoard.length > 64 ||
    !BOARD_PATTERN.test(normalizedBoard) ||
    !ARTICLE_ID_PATTERN.test(normalizedArticleId)
  ) {
    return null;
  }

  return { articleId: normalizedArticleId, board: normalizedBoard };
}

export function isValidBoard(board: string): boolean {
  return normalizeArticleRef(board, "M.0.A") !== null;
}
