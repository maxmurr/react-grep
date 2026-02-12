const code = (lines: string[]) => `<code>${lines.join("\n")}</code>`;

const ESM_IMPORT = code([
  `<span class="token-keyword">import</span> <span class="token-string">"react-grep"</span>;`,
]);

const SCRIPT_TAG = code([
  `&lt;<span class="token-tag">script</span> <span class="token-attr">src</span>=<span class="token-string">"https://unpkg.com/react-grep/dist/index.global.js"</span>&gt;&lt;/<span class="token-tag">script</span>&gt;`,
]);

const MANUAL_CONTROL = code([
  `<span class="token-keyword">import</span> { <span class="token-function">init</span>, <span class="token-function">destroy</span> } <span class="token-keyword">from</span> <span class="token-string">"react-grep"</span>;`,
  ``,
  `<span class="token-function">init</span>();    <span class="token-comment">// start the inspector</span>`,
  `<span class="token-function">destroy</span>(); <span class="token-comment">// stop and clean up</span>`,
]);

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
        Try it — hold <kbd>⌘</kbd> and hover anywhere on this page
      </div>

      <div className="install-command animate-in" style={{ animationDelay: "300ms" }}>
        <span className="prompt">$ </span>
        <code>npm install react-grep</code>
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
        <pre className="code-block" dangerouslySetInnerHTML={{ __html: ESM_IMPORT }} />
        <p className="code-note">The inspector activates automatically on import.</p>
      </div>

      <div className="code-section">
        <h3 className="code-label">Script Tag</h3>
        <pre className="code-block" dangerouslySetInnerHTML={{ __html: SCRIPT_TAG }} />
      </div>

      <div className="code-section">
        <h3 className="code-label">Manual Control</h3>
        <pre className="code-block" dangerouslySetInnerHTML={{ __html: MANUAL_CONTROL }} />
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
