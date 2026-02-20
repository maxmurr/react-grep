import { InstallTabs } from "./install-tabs";
import { FAQ_ITEMS } from "./faq-data";

const COMPAT_ROWS = [
  { framework: "Vite + React", status: "Tested" },
  { framework: "Next.js 16 (Turbopack)", status: "Tested" },
  { framework: "Next.js 16 (Webpack)", status: "Tested" },
  { framework: "React Router v7", status: "Tested" },
  { framework: "Gatsby", status: "Tested" },
  { framework: "esbuild", status: "Tested" },
];

const Page = () => (
  <main id="main">
    <section className="hero">
      <a
        href="https://www.npmjs.com/package/react-grep"
        className="npm-badge animate-in"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="npm-badge-icon">npm</span>
        react-grep
      </a>

      <h1 className="title animate-in" style={{ animationDelay: "60ms" }}>
        react<span className="highlight">-grep</span>
        <span className="cursor" aria-hidden="true" />
        <span className="sr-only"> - React Component Inspector</span>
      </h1>

      <p className="tagline animate-in" style={{ animationDelay: "120ms" }}>
        Hold <kbd>⌘</kbd> to see React component names + file:line overlaid on any element.
      </p>

      <p className="subtitle animate-in" style={{ animationDelay: "180ms" }}>
        Zero dependencies. Works with any React app in development mode.
      </p>

      <div className="try-prompt animate-in" style={{ animationDelay: "240ms" }}>
        Try it - hold <kbd>⌘</kbd> and hover anywhere on this page
      </div>

      <div className="animate-in" style={{ animationDelay: "300ms" }}>
        <InstallTabs />
      </div>
    </section>

    <section
      className="features animate-in"
      style={{ animationDelay: "400ms" }}
      aria-label="Features"
    >
      <div className="feature-card">
        <div className="feature-keys">
          <kbd>⌘</kbd>
          <span className="key-plus">+</span>
          hover
        </div>
        <h2 className="feature-title">Inspect</h2>
        <p className="feature-desc">
          See component names and source file locations overlaid on any element.
        </p>
      </div>

      <div className="feature-card">
        <div className="feature-keys">
          <kbd>Shift</kbd>
        </div>
        <h2 className="feature-title">Toggle Source</h2>
        <p className="feature-desc">Switch between the component definition and the call site.</p>
      </div>

      <div className="feature-card">
        <div className="feature-keys">
          <kbd>⌘</kbd>
          <kbd>Shift</kbd>
          <span className="key-plus">+</span>
          Click
        </div>
        <h2 className="feature-title">Copy Path</h2>
        <p className="feature-desc">Copy file:line to your clipboard instantly.</p>
      </div>
    </section>

    <section className="section" aria-label="Why react-grep">
      <h2 className="section-title">Why react-grep</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">0</span>
          <span className="stat-label">Dependencies</span>
          <p className="stat-desc">No runtime dependencies. Just import and go.</p>
        </div>
        <div className="stat-card">
          <span className="stat-value">~5KB</span>
          <span className="stat-label">Gzipped</span>
          <p className="stat-desc">Lightweight enough for any dev setup.</p>
        </div>
        <div className="stat-card">
          <span className="stat-value">6+</span>
          <span className="stat-label">Frameworks</span>
          <p className="stat-desc">Vite, Next.js, Gatsby, React Router, and more.</p>
        </div>
      </div>
    </section>

    <section className="section" aria-label="How It Works">
      <h2 className="section-title">How It Works</h2>
      <p className="section-body">
        react-grep reads React&apos;s internal fiber tree to find component names and source
        locations. When you hold the modifier key and hover, it highlights the element and shows a
        tooltip with the component name, file path, and line number. Source maps are resolved
        automatically so you see original file paths, not bundled output.
      </p>
      <p className="section-body">
        This only works in development builds of React, which include{" "}
        <code className="inline-code">_debugSource</code> and fiber metadata. Production builds
        strip this data, so react-grep is safe to leave in your dev dependencies.
      </p>
    </section>

    <section className="section" aria-label="Framework Compatibility">
      <h2 className="section-title">Compatibility</h2>
      <p className="section-body">
        react-grep works with any React app that uses react-dom in development mode. No
        framework-specific plugin is needed.
      </p>
      <div className="compat-table-wrap">
        <table className="compat-table">
          <thead>
            <tr>
              <th scope="col">Framework / Bundler</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {COMPAT_ROWS.map((row) => (
              <tr key={row.framework}>
                <td>{row.framework}</td>
                <td>
                  <span className="compat-check" aria-label={row.status}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="section-body section-note">
        Next.js has dedicated support for server component names and Turbopack indexed source maps.
      </p>
    </section>

    <section className="section" aria-label="Usage">
      <h2 className="section-title">Usage</h2>

      <div className="code-section">
        <h3 className="code-label">ESM Import</h3>
        <pre className="code-block">
          <code>
            <span className="token-keyword">import</span>{" "}
            <span className="token-string">&quot;react-grep&quot;</span>;
          </code>
        </pre>
        <p className="code-note">The inspector activates automatically on import.</p>
      </div>

      <div className="code-section">
        <h3 className="code-label">Script Tag</h3>
        <pre className="code-block">
          <code>
            {"<"}
            <span className="token-tag">script</span> <span className="token-attr">src</span>=
            <span className="token-string">
              &quot;https://unpkg.com/react-grep/dist/index.global.js&quot;
            </span>
            {">"}&lt;/
            <span className="token-tag">script</span>
            {">"}
          </code>
        </pre>
      </div>

      <div className="code-section">
        <h3 className="code-label">Manual Control</h3>
        <pre className="code-block">
          <code>
            <span className="token-keyword">import</span>
            {" { "}
            <span className="token-function">init</span>
            {", "}
            <span className="token-function">destroy</span>
            {" } "}
            <span className="token-keyword">from</span>{" "}
            <span className="token-string">&quot;react-grep&quot;</span>;{"\n\n"}
            <span className="token-function">init</span>
            {"();    "}
            <span className="token-comment">{"// start the inspector"}</span>
            {"\n"}
            <span className="token-function">destroy</span>
            {"(); "}
            <span className="token-comment">{"// stop and clean up"}</span>
          </code>
        </pre>
      </div>
    </section>

    <section className="section" aria-label="Frequently Asked Questions">
      <h2 className="section-title">Frequently Asked Questions</h2>
      <div className="faq-list">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="faq-item">
            <summary className="faq-question">{item.question}</summary>
            <p className="faq-answer">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>

    <footer className="footer">
      <div className="footer-links">
        <a
          href="https://github.com/maxmurr/react-grep"
          className="footer-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <span className="footer-sep" aria-hidden="true">
          ·
        </span>
        <a
          href="https://www.npmjs.com/package/react-grep"
          className="footer-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          npm
        </a>
        <span className="footer-sep" aria-hidden="true">
          ·
        </span>
        <span className="footer-text">MIT License</span>
      </div>
    </footer>
  </main>
);

export default Page;
