import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/types.ts", "src/__tests__/**"],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
    restoreMocks: true,
  },
});
