import { InstallTabs } from "./install-tabs";

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

    <section className="section">
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
