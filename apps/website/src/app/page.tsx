const Page = () => (
  <main
    style={{
      maxWidth: "680px",
      margin: "0 auto",
      padding: "4rem 1.5rem",
      lineHeight: 1.6,
    }}
  >
    <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>react-grep</h1>
    <p style={{ fontSize: "1.25rem", color: "#6b7280", marginTop: 0 }}>
      Hold <kbd>⌘</kbd> to see React component names + file:line overlaid on any element.
    </p>

    <h2>Install</h2>
    <pre
      style={{
        backgroundColor: "#18181b",
        color: "#e4e4e7",
        padding: "1rem",
        borderRadius: "8px",
        overflowX: "auto",
      }}
    >
      <code>npm install react-grep</code>
    </pre>

    <h2>Usage</h2>
    <h3>Script tag (IIFE)</h3>
    <pre
      style={{
        backgroundColor: "#18181b",
        color: "#e4e4e7",
        padding: "1rem",
        borderRadius: "8px",
        overflowX: "auto",
      }}
    >
      <code>{`<script src="https://unpkg.com/react-grep/dist/index.global.js"></script>`}</code>
    </pre>

    <h3>ESM import</h3>
    <pre
      style={{
        backgroundColor: "#18181b",
        color: "#e4e4e7",
        padding: "1rem",
        borderRadius: "8px",
        overflowX: "auto",
      }}
    >
      <code>{`import "react-grep";`}</code>
    </pre>
    <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>
      The inspector activates automatically. For manual control:
    </p>
    <pre
      style={{
        backgroundColor: "#18181b",
        color: "#e4e4e7",
        padding: "1rem",
        borderRadius: "8px",
        overflowX: "auto",
      }}
    >
      <code>{`import { init, destroy } from "react-grep";\n\ninit();    // start the inspector\ndestroy(); // stop and clean up`}</code>
    </pre>

    <h2>How it works</h2>
    <ul>
      <li>
        <strong>Inspect:</strong> Hold <kbd>⌘</kbd> (Mac) / <kbd>Ctrl</kbd> (Windows/Linux) and
        hover over any element to see the React component name and source file location.
      </li>
      <li>
        <strong>Toggle source:</strong> Tap <kbd>Shift</kbd> (while holding modifier) to switch
        between the component definition and the call site where it&#39;s rendered.
      </li>
      <li>
        <strong>Copy:</strong> <kbd>⌘</kbd>+<kbd>Shift</kbd>+Click to copy the active file path and
        line number to your clipboard.
      </li>
    </ul>
  </main>
);

export default Page;
