import type { ComponentInfo } from "./types";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

const COLORS = {
  name: "#93c5fd",
  tag: "#a78bfa",
  path: "#71717a",
  pathActive: "#a1a1aa",
  pathDim: "#3f3f46",
  hint: "#52525b",
} as const;

const HIGHLIGHT_STYLES: Partial<CSSStyleDeclaration> = {
  position: "fixed",
  pointerEvents: "none",
  zIndex: "2147483646",
  backgroundColor: "rgba(66, 135, 245, 0.15)",
  border: "1.5px solid rgba(66, 135, 245, 0.6)",
  borderRadius: "3px",
  display: "none",
  transition: "top 60ms ease-out, left 60ms ease-out, width 60ms ease-out, height 60ms ease-out",
};

const TOOLTIP_STYLES: Partial<CSSStyleDeclaration> = {
  position: "fixed",
  pointerEvents: "none",
  zIndex: "2147483647",
  display: "none",
  fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
  fontSize: "12px",
  lineHeight: "1.4",
  color: "#e4e4e7",
  backgroundColor: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: "6px",
  padding: "4px 8px",
  whiteSpace: "nowrap",
  maxWidth: "500px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
};

const applyStyles = (el: HTMLElement, styles: Partial<CSSStyleDeclaration>) => {
  Object.assign(el.style, styles);
};

const truncatePath = (filePath: string): string => {
  const parts = filePath.split("/");
  if (parts.length <= 3) return filePath;
  return `.../${parts.slice(-3).join("/")}`;
};

const createSpan = (text: string, styles: Partial<CSSStyleDeclaration>): HTMLSpanElement => {
  const span = document.createElement("span");
  span.textContent = text;
  Object.assign(span.style, styles);
  return span;
};

export class OverlayManager {
  private highlight: HTMLDivElement | null = null;
  private tooltip: HTMLDivElement | null = null;

  init() {
    if (this.highlight) return;

    this.highlight = document.createElement("div");
    this.highlight.dataset.reactGrep = "highlight";
    applyStyles(this.highlight, HIGHLIGHT_STYLES);
    document.body.appendChild(this.highlight);

    this.tooltip = document.createElement("div");
    this.tooltip.dataset.reactGrep = "tooltip";
    applyStyles(this.tooltip, TOOLTIP_STYLES);
    document.body.appendChild(this.tooltip);
  }

  show(el: Element, info: ComponentInfo, activeSource: "source" | "callSite" = "source") {
    if (!this.highlight || !this.tooltip) return;

    const rect = el.getBoundingClientRect();

    this.highlight.style.top = `${rect.top}px`;
    this.highlight.style.left = `${rect.left}px`;
    this.highlight.style.width = `${rect.width}px`;
    this.highlight.style.height = `${rect.height}px`;
    this.highlight.style.display = "block";

    this.tooltip.textContent = "";

    this.tooltip.appendChild(createSpan(info.name, { color: COLORS.name, fontWeight: "600" }));

    if (info.elementTag != null) {
      this.tooltip.appendChild(createSpan(" > ", { color: COLORS.path }));
      this.tooltip.appendChild(
        createSpan(info.elementTag, { color: COLORS.tag, fontWeight: "600" }),
      );
    }

    const filePath = info.source ? `${info.source.fileName}:${info.source.lineNumber}` : null;
    const callSitePath = info.callSite
      ? `${info.callSite.fileName}:${info.callSite.lineNumber}`
      : null;

    if (filePath && callSitePath) {
      const sourceColor = activeSource === "source" ? COLORS.pathActive : COLORS.pathDim;
      const callSiteColor = activeSource === "callSite" ? COLORS.pathActive : COLORS.pathDim;
      const shiftHint = isMac ? "\u21E7" : "Shift";
      const sourceText = truncatePath(filePath);
      const callSiteText = truncatePath(callSitePath);
      this.tooltip.appendChild(
        createSpan(
          ` ${activeSource === "callSite" ? "(" : ""}${sourceText}${activeSource === "callSite" ? ")" : ""}`,
          { color: sourceColor },
        ),
      );
      this.tooltip.appendChild(createSpan(` ${shiftHint} `, { color: COLORS.hint }));
      this.tooltip.appendChild(
        createSpan(
          `${activeSource === "source" ? "(" : ""}${callSiteText}${activeSource === "source" ? ")" : ""}`,
          { color: callSiteColor },
        ),
      );
    } else if (filePath) {
      this.tooltip.appendChild(createSpan(` ${truncatePath(filePath)}`, { color: COLORS.path }));
    }

    const tooltipRect = this.tooltip.getBoundingClientRect();
    let top = rect.top - tooltipRect.height - 6;
    let left = rect.left;

    if (top < 4) {
      top = rect.bottom + 6;
    }
    if (left + tooltipRect.width > window.innerWidth - 4) {
      left = window.innerWidth - tooltipRect.width - 4;
    }

    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${Math.max(4, left)}px`;
    this.tooltip.style.display = "block";
  }

  showCopied(location: string) {
    if (!this.tooltip) return;
    this.tooltip.textContent = "";
    this.tooltip.appendChild(createSpan("Copied!", { color: "#4ade80", fontWeight: "600" }));
    this.tooltip.appendChild(createSpan(` ${truncatePath(location)}`, { color: "#a1a1aa" }));
    this.tooltip.style.display = "block";
    setTimeout(() => this.hide(), 1500);
  }

  hide() {
    if (this.highlight) this.highlight.style.display = "none";
    if (this.tooltip) this.tooltip.style.display = "none";
  }

  destroy() {
    this.highlight?.remove();
    this.tooltip?.remove();
    this.highlight = null;
    this.tooltip = null;
  }
}
