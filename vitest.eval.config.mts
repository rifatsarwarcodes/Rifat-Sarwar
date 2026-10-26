import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * The AI twin's behaviour checks (npm run twin:eval). They call the real Gemini API, so they're
 * kept out of `npm test`, run one at a time to stay inside free-tier rate limits, and gate
 * `npm run twin:deploy`.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["evals/**/*.eval.ts"],
    environment: "node",
    testTimeout: 120_000,
    fileParallelism: false,
    maxConcurrency: 1,
    // Always show output: quality-check slips are logged rather than failed, and must stay visible.
    silent: false,
  },
});
