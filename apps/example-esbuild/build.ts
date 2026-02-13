import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/main.tsx"],
  bundle: true,
  outdir: "dist",
  format: "esm",
  jsx: "automatic",
  sourcemap: true,
  alias: {
    "react-grep": "../../packages/react-grep/src/index.ts",
  },
  define: {
    "process.env.NODE_ENV": '"development"',
  },
});
