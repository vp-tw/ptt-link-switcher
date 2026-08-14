import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*.{js,json,md,svelte,ts,yaml,yml}": "vp check --fix",
  },
  test: {
    coverage: {
      enabled: false,
    },
    include: ["packages/**/*.test.ts"],
  },
});
