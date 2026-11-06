import { fileURLToPath } from "node:url";

import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*.{js,json,md,svelte,ts,yaml,yml}": "vp check --fix",
  },
  test: {
    alias: {
      "@vp-tw/ptt-link-switcher": fileURLToPath(
        new URL("./packages/core/src/index.ts", import.meta.url),
      ),
    },
    coverage: {
      enabled: false,
    },
    include: ["packages/**/*.test.ts", "apps/web/src/**/*.test.ts"],
  },
});
