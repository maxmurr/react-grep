"use client";

import { useCallback, useRef, useState } from "react";

const MANAGERS = [
  { label: "npm", command: "npm install -D react-grep" },
  { label: "yarn", command: "yarn add -D react-grep" },
  { label: "pnpm", command: "pnpm add -D react-grep" },
  { label: "bun", command: "bun add -D react-grep" },
] as const;

const CopyIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const InstallTabs = () => {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(MANAGERS[active].command);
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1500);
  }, [active]);

  return (
    <div className="install-tabs">
      <div className="install-tabs-bar" role="tablist">
        {MANAGERS.map((pm, i) => (
          <button
            key={pm.label}
            role="tab"
            aria-selected={i === active}
            className={`install-tab${i === active ? " install-tab-active" : ""}`}
            onClick={() => setActive(i)}
          >
            {pm.label}
          </button>
        ))}
      </div>
      <div className="install-command-body" role="tabpanel">
        <span className="prompt">$ </span>
        <span className="install-command-stack">
          {MANAGERS.map((pm, i) => (
            <code
              key={pm.label}
              className={i === active ? "install-command-visible" : "install-command-hidden"}
            >
              {pm.command}
            </code>
          ))}
        </span>
        <button
          className={`install-copy${copied ? " install-copy-done" : ""}`}
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy to clipboard"}
        >
          <span className="install-copy-icon">{copied ? <CheckIcon /> : <CopyIcon />}</span>
        </button>
      </div>
    </div>
  );
};
