<p align="center">
  <a href="https://react-grep.com">
    <h1 align="center">react-grep</h1>
  </a>
</p>

<p align="center">
  Hold <strong>Cmd</strong> to see React component names + file:line overlaid on any element.
</p>

<p align="center">
  <a href="https://npmjs.com/package/react-grep"><img src="https://img.shields.io/npm/v/react-grep?style=flat&colorA=050506&colorB=34d399" alt="npm version"></a>
  <a href="https://npmjs.com/package/react-grep"><img src="https://img.shields.io/npm/dm/react-grep?style=flat&colorA=050506&colorB=34d399" alt="npm downloads"></a>
  <a href="https://bundlephobia.com/package/react-grep"><img src="https://img.shields.io/bundlephobia/minzip/react-grep?style=flat&colorA=050506&colorB=34d399&label=bundle" alt="bundle size"></a>
  <a href="https://github.com/maxmurr/react-grep/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/react-grep?style=flat&colorA=050506&colorB=34d399" alt="license"></a>
</p>

<br/>

- **Inspect** - Hold `Cmd` (Mac) / `Ctrl` (Windows/Linux) and hover over any element to see the React component name and source file location
- **Toggle source** - Tap `Shift` (while holding modifier) to switch between the component definition and the call site where it's rendered
- **Copy** - `Cmd+Shift+Click` to copy the active file path and line number to your clipboard

Zero dependencies. Works with any React app in development mode.

## Install

```sh
# npm
npm install react-grep

# pnpm
pnpm add react-grep

# yarn
yarn add react-grep

# bun
bun add react-grep
```

## Usage

### ESM import

```ts
import "react-grep";
```

That's it. The inspector activates automatically on page load.

If you need manual control:

```ts
import { init, destroy } from "react-grep";

init();
destroy();
```

### Script tag

```html
<script src="https://unpkg.com/react-grep/dist/index.global.js"></script>
```

The inspector starts automatically when the script loads.

## Compatibility

react-grep works with any React app that uses `react-dom` in development mode. It reads React's internal fiber tree, so no framework-specific plugin is needed.

| Framework / Bundler              | Status                 |
| -------------------------------- | ---------------------- |
| Vite + React                     | Tested                 |
| Next.js 16 (Turbopack)           | Tested                 |
| Next.js 16 (Webpack)             | Tested                 |
| React Router v7 (framework mode) | Tested                 |
| Gatsby                           | Tested                 |
| esbuild                          | Tested                 |
| Custom Webpack / Rollup          | Untested, should work  |
| Create React App                 | Deprecated             |
| React Native                     | Not supported (no DOM) |

Next.js has dedicated support for server component names and Turbopack indexed source maps.

Source map resolution is automatic. If your dev server serves source maps (inline or external), react-grep will resolve bundled locations back to original files.

## How it works

react-grep reads React's internal fiber tree to find component names and source locations (`_debugSource` / `_debugStack`). This data is only available in **development builds** of React. Production builds strip it out.

When the modifier key is held:

1. The hovered DOM element is highlighted with a blue overlay
2. A tooltip shows the component name, file path, and call site (if available)
3. Tap `Shift` to toggle between the component source and call site. The active source is highlighted, the inactive one is dimmed
4. `Cmd+Shift+Click` copies the active `file:line` to clipboard (without toggling)

## API

### `init()`

Start the inspector. Called automatically on import, only needed if you previously called `destroy()`.

### `destroy()`

Stop the inspector and remove all event listeners and DOM elements.

## License

[MIT](https://github.com/maxmurr/react-grep/blob/main/LICENSE)
