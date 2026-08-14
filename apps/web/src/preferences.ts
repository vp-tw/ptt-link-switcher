import { atom } from "nanostores";

import { providers, type ProviderId } from "@vp-tw/ptt-link-switcher";

export interface Preferences {
  readonly defaultProvider: ProviderId;
  readonly hiddenProviders: readonly ProviderId[];
  readonly providerOrder: readonly ProviderId[];
}

const storageKey = "ptt-link-switcher:preferences";
const providerIds = providers.map(({ id }) => id);

const defaults: Preferences = {
  defaultProvider: "official",
  hiddenProviders: [],
  providerOrder: providerIds,
};

function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && providerIds.includes(value as ProviderId);
}

function normalizePreferences(value: unknown): Preferences {
  if (typeof value !== "object" || value === null) return defaults;

  const candidate = value as Partial<Preferences>;
  const savedOrder = Array.isArray(candidate.providerOrder)
    ? candidate.providerOrder.filter(isProviderId)
    : [];
  const providerOrder = [...new Set([...savedOrder, ...providerIds])] as ProviderId[];
  const hiddenProviders = Array.isArray(candidate.hiddenProviders)
    ? candidate.hiddenProviders.filter(isProviderId)
    : [];
  const defaultProvider = isProviderId(candidate.defaultProvider)
    ? candidate.defaultProvider
    : defaults.defaultProvider;

  return { defaultProvider, hiddenProviders, providerOrder };
}

function loadPreferences(): Preferences {
  if (typeof localStorage === "undefined") return defaults;

  try {
    const saved = localStorage.getItem(storageKey);
    return saved === null ? defaults : normalizePreferences(JSON.parse(saved));
  } catch {
    return defaults;
  }
}

export const preferences = atom<Preferences>(loadPreferences());

export function savePreferences(next: Preferences): void {
  const normalized = normalizePreferences(next);
  preferences.set(normalized);
  localStorage.setItem(storageKey, JSON.stringify(normalized));
}
