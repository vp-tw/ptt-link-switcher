const AID_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
const AID_PATTERN = /^[0-9A-Za-z_-]{8}$/;
const ARTICLE_ID_PATTERN = /^(M|G)\.(\d+)\.A(?:\.([0-9A-F]{3}))?$/;

export function isValidAid(value: string): boolean {
  return AID_PATTERN.test(value);
}

export function aidToArticleId(aid: string): string | null {
  const normalized = aid.startsWith("#") ? aid.slice(1) : aid;
  if (!isValidAid(normalized)) return null;

  let timestamp = 0;
  for (const character of normalized.slice(0, 6)) {
    const index = AID_ALPHABET.indexOf(character);
    if (index < 0) return null;
    timestamp = timestamp * 64 + index;
  }

  let checksum = 0;
  for (const character of normalized.slice(6)) {
    const index = AID_ALPHABET.indexOf(character);
    if (index < 0) return null;
    checksum = checksum * 64 + index;
  }

  const checksumPart =
    checksum === 0 ? "" : `.${checksum.toString(16).toUpperCase().padStart(3, "0")}`;
  return `M.${timestamp}.A${checksumPart}`;
}

export function articleIdToAid(articleId: string): string | null {
  const match = ARTICLE_ID_PATTERN.exec(articleId.toUpperCase());
  if (!match || match[1] !== "M" || match[2] === undefined) return null;

  let timestamp = Number(match[2]);
  let checksum = match[3] === undefined ? 0 : Number.parseInt(match[3], 16);
  if (!Number.isSafeInteger(timestamp) || timestamp < 0 || checksum > 0xfff) return null;

  let encodedTimestamp = "";
  for (let index = 0; index < 6; index += 1) {
    encodedTimestamp = AID_ALPHABET[timestamp % 64]! + encodedTimestamp;
    timestamp = Math.floor(timestamp / 64);
  }

  let encodedChecksum = "";
  for (let index = 0; index < 2; index += 1) {
    encodedChecksum = AID_ALPHABET[checksum % 64]! + encodedChecksum;
    checksum = Math.floor(checksum / 64);
  }

  return `#${encodedTimestamp}${encodedChecksum}`;
}
