# react-grep

## 0.3.1

### Patch Changes

- Fix source map resolution for React Server Components in Next.js with webpack bundler

## 0.3.0

### Minor Changes

- Add webpack/Gatsby source map support. Fix stack frame parsing for Gatsby's patched createElement and resolve source maps from webpack eval'd bundle chunks via the Performance API.

## 0.2.2

### Patch Changes

- Set npm homepage to https://react-grep.com

## 0.2.1

### Patch Changes

- Replace deprecated `navigator.platform` with `userAgentData` fallback, replace unsafe `Function` type with specific callable types, bound source map cache, fix race condition in click handler, and save/restore cursor properly

## 0.2.0

### Minor Changes

- 7c2815e: Drop CommonJS build output to reduce package size

### Patch Changes

- 997cc32: Fix type narrowing for `_debugOwner` when owner is a server component

## 0.1.2

### Patch Changes

- Fix source map resolution for Next.js/Turbopack
  - Add source map discovery via `SourceMap`/`X-SourceMap` response headers and `<url>.map` convention
  - Support indexed source maps (sections format) used by Turbopack
  - Resolve server component source positions via `__nextjs_source-map` endpoint
  - Display server component names (e.g. `Page`) instead of internal Next.js wrappers (e.g. `SegmentViewNode`)
  - Skip React internal `fakeJSXCallSite` stack frames

## 0.1.1

### Patch Changes

- Fix tooltip path truncation for deep directory structures by keeping last 2 path segments instead of 3

## 0.1.0

### Minor Changes

- Initial release: hold Cmd to inspect React component names and source locations on any element
