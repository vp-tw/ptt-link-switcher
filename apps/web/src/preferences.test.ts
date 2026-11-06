import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const storageKey = "ptt-link-switcher:preferences";
const defaultPreferences = {
  defaultProvider: "official",
  hiddenProviders: [],
  providerOrder: ["official", "beptt", "pttweb", "moptt", "nextptt"],
};

function memoryStorage() {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
    clear: () => entries.clear(),
  };
}

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe("resetPreferences", () => {
  it("restores reader defaults and deletes only this repository's saved preferences", async () => {
    const storage = memoryStorage();
    storage.setItem(
      storageKey,
      JSON.stringify({
        defaultProvider: "nextptt",
        hiddenProviders: ["moptt"],
        providerOrder: ["nextptt", "moptt", "official", "beptt", "pttweb"],
      }),
    );
    storage.setItem("another-repository:preferences", "keep me");
    vi.stubGlobal("localStorage", storage);
    const { preferences, resetPreferences } = await import("./preferences.js");
    expect(preferences.get().defaultProvider).toBe("nextptt");

    resetPreferences();

    expect(preferences.get()).toEqual(defaultPreferences);
    expect(storage.getItem(storageKey)).toBeNull();
    expect(storage.getItem("another-repository:preferences")).toBe("keep me");
  });

  it("keeps the reset after reloading without saving a replacement value", async () => {
    const storage = memoryStorage();
    vi.stubGlobal("localStorage", storage);
    const { savePreferences, resetPreferences } = await import("./preferences.js");
    savePreferences({
      defaultProvider: "moptt",
      hiddenProviders: ["beptt"],
      providerOrder: ["moptt", "pttweb", "official", "beptt", "nextptt"],
    });

    resetPreferences();
    vi.resetModules();
    const { preferences } = await import("./preferences.js");

    expect(storage.getItem(storageKey)).toBeNull();
    expect(preferences.get()).toEqual(defaultPreferences);
  });
});
