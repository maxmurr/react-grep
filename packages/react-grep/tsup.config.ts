import { defineConfig, type Options } from "tsup";

const IIFE_BUILD: Options = {
  entry: ["src/index.ts"],
  format: ["iife"],
  globalName: "ReactGrep",
  platform: "browser",
  target: "es2022",
  outDir: "dist",
  clean: true,
  minify: true,
  splitting: false,
  sourcemap: false,
  treeshake: true,
};

const LIBRARY_BUILD: Options = {
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  platform: "browser",
  target: "es2022",
  outDir: "dist",
  clean: false,
  dts: true,
  splitting: false,
  sourcemap: false,
  treeshake: true,
};

export default defineConfig([IIFE_BUILD, LIBRARY_BUILD]);
