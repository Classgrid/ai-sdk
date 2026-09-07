import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "core/index": "src/core/index.ts",
    "rag/index": "src/rag/index.ts",
    "memory/index": "src/memory/index.ts",
    "channels/index": "src/channels/index.ts",
    "guardrails/index": "src/guardrails/index.ts",
    "react/index": "src/react/index.ts",
  },
  format: ["esm", "cjs"],
  dts: false,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ["mongoose", "ioredis", "@xenova/transformers", "react", "react-dom", "framer-motion"],
  outDir: "dist",
});
