# react-grep

Hold **Cmd** to see React component names + file:line overlaid on any element.

- **Inspect** — Hold `Cmd` (Mac) / `Ctrl` (Windows/Linux) and hover over any element to see the React component name and source file location
- **Toggle source** — Tap `Shift` (while holding modifier) to switch between the component definition and the call site where it's rendered
- **Copy** — `Cmd+Shift+Click` to copy the active file path and line number to your clipboard

Zero dependencies. Works with any React app in development mode.

## Install

```bash
npm install react-grep
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

init(); // start the inspector
destroy(); // stop and clean up
```

### Script tag

```html
<script src="https://unpkg.com/react-grep/dist/index.global.js"></script>
```

The inspector starts automatically when the script loads.

## How it works

react-grep reads React's internal fiber tree to find component names and source locations (`_debugSource` / `_debugStack`). This data is only available in **development builds** of React — production builds strip it out.

When the modifier key is held:

1. The hovered DOM element is highlighted with a blue overlay
2. A tooltip shows the component name, file path, and call site (if available)
3. Tap `Shift` to toggle between the component source and call site — the active source is highlighted, the inactive one is dimmed
4. `Cmd+Shift+Click` copies the active `file:line` to clipboard (without toggling)

## API

### `init()`

Start the inspector. Called automatically on import — only needed if you previously called `destroy()`.

### `destroy()`

Stop the inspector and remove all event listeners and DOM elements.

## License

MIT
