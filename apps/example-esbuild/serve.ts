import * as esbuild from "esbuild";

const ctx = await esbuild.context({
  entryPoints: ["src/main.tsx"],
  bundle: true,
  outdir: "public/dist",
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

const server = await ctx.serve({
  port: 3001,
  servedir: "public",
  fallback: "public/index.html",
});

console.log(`esbuild dev server running at http://localhost:${server.port}`);
