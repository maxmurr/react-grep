const Header = () => (
  <header style={{ padding: "2rem", borderBottom: "1px solid #e5e7eb" }}>
    <h1 style={{ margin: 0, fontSize: "1.5rem" }}>react-grep example</h1>
    <p style={{ margin: "0.5rem 0 0", color: "#6b7280" }}>
      Hold <kbd>⌘</kbd> (Mac) or <kbd>Ctrl</kbd> (Windows/Linux) and hover over elements to inspect
      React components.
    </p>
  </header>
);

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div
    style={{
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      padding: "1.5rem",
      flex: "1 1 300px",
    }}
  >
    <h3 style={{ margin: "0 0 0.75rem" }}>{title}</h3>
    {children}
  </div>
);

const Badge = ({ label }: { label: string }) => (
  <span
    style={{
      display: "inline-block",
      padding: "2px 8px",
      fontSize: "12px",
      borderRadius: "9999px",
      backgroundColor: "#dbeafe",
      color: "#1d4ed8",
      marginRight: "4px",
    }}
  >
    {label}
  </span>
);

const CardGrid = () => (
  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
    <Card title="Inspector">
      <p style={{ color: "#6b7280", margin: 0 }}>
        Hover over any element while holding the modifier key to see its React component name and
        source location.
      </p>
    </Card>
    <Card title="Copy to Clipboard">
      <p style={{ color: "#6b7280", margin: 0 }}>
        Hold modifier + Shift and click to copy the file path to your clipboard.
      </p>
    </Card>
    <Card title="Nested Components">
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
        <Badge label="react" />
        <Badge label="devtools" />
        <Badge label="inspector" />
        <Badge label="overlay" />
      </div>
    </Card>
  </div>
);

export const App = () => (
  <div style={{ maxWidth: "800px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
    <Header />
    <main style={{ padding: "2rem" }}>
      <CardGrid />
    </main>
  </div>
);
