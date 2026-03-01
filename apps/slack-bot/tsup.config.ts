import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    app: "src/app.ts",
    main: "src/main.ts",
  },
  format: ["esm"],
  dts: {
    compilerOptions: {
      composite: false,
    },
  },
  clean: true,
  external: ["@anthropic-ai/claude-agent-sdk"],
  target: "node20",
});
