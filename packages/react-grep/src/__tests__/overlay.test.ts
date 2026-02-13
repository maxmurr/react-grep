import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../env", () => ({ isMac: false }));

import { OverlayManager } from "../overlay";
import type { ComponentInfo, DebugSource } from "../types";

const makeSource = (fileName: string, lineNumber: number): DebugSource => ({
  fileName,
  lineNumber,
});

const makeInfo = (overrides: Partial<ComponentInfo> = {}): ComponentInfo => ({
  kind: "component",
  name: "Button",
  elementTag: null,
  source: makeSource("src/button.tsx", 10),
  callSite: null,
  ...overrides,
});

const makeElement = (rect: Partial<DOMRect> = {}): Element => {
  const el = document.createElement("div");
  el.getBoundingClientRect = () => ({
    top: 100,
    left: 100,
    width: 200,
    height: 50,
    bottom: 150,
    right: 300,
    x: 100,
    y: 100,
    toJSON: () => ({}),
    ...rect,
  });
  return el;
};

describe("OverlayManager", () => {
  let overlay: OverlayManager;

  beforeEach(() => {
    overlay = new OverlayManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    overlay.destroy();
    vi.useRealTimers();
  });

  describe("init", () => {
    it("creates highlight and tooltip elements in the DOM", () => {
      overlay.init();
      expect(document.querySelector("[data-react-grep='highlight']")).not.toBeNull();
      expect(document.querySelector("[data-react-grep='tooltip']")).not.toBeNull();
    });

    it("is idempotent — second call does not create duplicates", () => {
      overlay.init();
      overlay.init();
      expect(document.querySelectorAll("[data-react-grep='highlight']")).toHaveLength(1);
      expect(document.querySelectorAll("[data-react-grep='tooltip']")).toHaveLength(1);
    });
  });

  describe("show", () => {
    it("returns early when not initialized", () => {
      overlay.show(makeElement(), makeInfo());
      expect(document.querySelector("[data-react-grep]")).toBeNull();
    });

    it("positions highlight to match element bounding rect", () => {
      overlay.init();
      overlay.show(makeElement({ top: 50, left: 60, width: 120, height: 30 }), makeInfo());
      const hl = document.querySelector("[data-react-grep='highlight']") as HTMLElement;
      expect(hl.style.top).toBe("50px");
      expect(hl.style.left).toBe("60px");
      expect(hl.style.width).toBe("120px");
      expect(hl.style.height).toBe("30px");
      expect(hl.style.display).toBe("block");
    });

    it("renders component name", () => {
      overlay.init();
      overlay.show(makeElement(), makeInfo({ name: "Header" }));
      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      expect(tooltip.textContent).toContain("Header");
    });

    it("renders elementTag with separator when present", () => {
      overlay.init();
      overlay.show(makeElement(), makeInfo({ elementTag: "div" }));
      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      expect(tooltip.textContent).toContain(" > ");
      expect(tooltip.textContent).toContain("div");
    });

    it("does not render elementTag separator when null", () => {
      overlay.init();
      overlay.show(makeElement(), makeInfo({ elementTag: null }));
      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      expect(tooltip.textContent).not.toContain(" > ");
    });

    it("renders source path only when no callSite", () => {
      overlay.init();
      overlay.show(makeElement(), makeInfo({ source: makeSource("src/app.tsx", 5) }));
      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      expect(tooltip.textContent).toContain("src/app.tsx:5");
    });

    it("renders source and callSite with activeSource=source", () => {
      overlay.init();
      const info = makeInfo({
        source: makeSource("src/button.tsx", 10),
        callSite: makeSource("src/page.tsx", 20),
      });
      overlay.show(makeElement(), info, "source");
      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      expect(tooltip.textContent).toContain("button.tsx:10");
      expect(tooltip.textContent).toContain("page.tsx:20");
      expect(tooltip.textContent).toContain("(");
    });

    it("renders source and callSite with activeSource=callSite", () => {
      overlay.init();
      const info = makeInfo({
        source: makeSource("src/button.tsx", 10),
        callSite: makeSource("src/page.tsx", 20),
      });
      overlay.show(makeElement(), info, "callSite");
      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      expect(tooltip.textContent).toContain("button.tsx:10");
      expect(tooltip.textContent).toContain("page.tsx:20");
    });

    it("shows Shift hint (non-Mac) when both source and callSite present", () => {
      overlay.init();
      const info = makeInfo({
        source: makeSource("a.tsx", 1),
        callSite: makeSource("b.tsx", 2),
      });
      overlay.show(makeElement(), info);
      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      expect(tooltip.textContent).toContain("Shift");
    });

    it("shows up-arrow shift hint on Mac", async () => {
      vi.resetModules();
      vi.doMock("../env", () => ({ isMac: true }));
      const { OverlayManager: MacOverlay } = await import("../overlay");
      const macOverlay = new MacOverlay();
      macOverlay.init();
      const info = makeInfo({
        source: makeSource("a.tsx", 1),
        callSite: makeSource("b.tsx", 2),
      });
      macOverlay.show(makeElement(), info);
      const tooltip = document.querySelector(
        "[data-react-grep='tooltip']:last-of-type",
      ) as HTMLElement;
      expect(tooltip.textContent).toContain("\u21E7");
      macOverlay.destroy();
    });

    it("renders no path when source is null", () => {
      overlay.init();
      overlay.show(makeElement(), makeInfo({ source: null, callSite: null }));
      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      expect(tooltip.textContent).toBe("Button");
    });

    it("truncates long paths to last 2 segments", () => {
      overlay.init();
      overlay.show(makeElement(), makeInfo({ source: makeSource("a/b/c/d/file.tsx", 1) }));
      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      expect(tooltip.textContent).toContain(".../d/file.tsx:1");
    });

    it("does not truncate paths with 2 or fewer segments", () => {
      overlay.init();
      overlay.show(makeElement(), makeInfo({ source: makeSource("src/file.tsx", 1) }));
      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      expect(tooltip.textContent).toContain("src/file.tsx:1");
    });

    it("repositions tooltip below element when near top edge", () => {
      overlay.init();
      const el = makeElement({ top: 2, bottom: 22 });

      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      tooltip.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        width: 200,
        height: 30,
        bottom: 30,
        right: 200,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      overlay.show(el, makeInfo());
      expect(parseFloat(tooltip.style.top)).toBe(28);
    });

    it("repositions tooltip when overflowing right edge", () => {
      overlay.init();
      Object.defineProperty(window, "innerWidth", { value: 300, writable: true });
      const el = makeElement({ left: 200 });

      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      tooltip.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        width: 200,
        height: 20,
        bottom: 20,
        right: 200,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      overlay.show(el, makeInfo());
      expect(parseFloat(tooltip.style.left)).toBeLessThanOrEqual(300 - 200 - 4);
    });

    it("clamps left to minimum of 4px", () => {
      overlay.init();
      Object.defineProperty(window, "innerWidth", { value: 100, writable: true });
      const el = makeElement({ left: -100 });

      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      tooltip.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        width: 200,
        height: 20,
        bottom: 20,
        right: 200,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      overlay.show(el, makeInfo());
      expect(parseFloat(tooltip.style.left)).toBe(4);
    });
  });

  describe("showCopied", () => {
    it("returns early when not initialized", () => {
      overlay.showCopied("src/file.tsx:1");
      expect(document.querySelector("[data-react-grep]")).toBeNull();
    });

    it("renders Copied! message with truncated path", () => {
      overlay.init();
      overlay.showCopied("a/b/c/file.tsx:10");
      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      expect(tooltip.textContent).toContain("Copied!");
      expect(tooltip.textContent).toContain(".../c/file.tsx:10");
      expect(tooltip.style.display).toBe("block");
    });

    it("hides tooltip after 1500ms", () => {
      overlay.init();
      overlay.showCopied("file.tsx:1");
      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      expect(tooltip.style.display).toBe("block");
      vi.advanceTimersByTime(1500);
      expect(tooltip.style.display).toBe("none");
    });

    it("clears previous timer on repeated calls", () => {
      overlay.init();
      overlay.showCopied("first.tsx:1");
      overlay.showCopied("second.tsx:2");
      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      expect(tooltip.textContent).toContain("second.tsx:2");
      vi.advanceTimersByTime(1500);
      expect(tooltip.style.display).toBe("none");
    });
  });

  describe("hide", () => {
    it("hides both highlight and tooltip", () => {
      overlay.init();
      overlay.show(makeElement(), makeInfo());
      overlay.hide();
      const hl = document.querySelector("[data-react-grep='highlight']") as HTMLElement;
      const tooltip = document.querySelector("[data-react-grep='tooltip']") as HTMLElement;
      expect(hl.style.display).toBe("none");
      expect(tooltip.style.display).toBe("none");
    });

    it("tolerates being called before init", () => {
      expect(() => overlay.hide()).not.toThrow();
    });
  });

  describe("destroy", () => {
    it("removes DOM elements", () => {
      overlay.init();
      overlay.destroy();
      expect(document.querySelector("[data-react-grep='highlight']")).toBeNull();
      expect(document.querySelector("[data-react-grep='tooltip']")).toBeNull();
    });

    it("clears copiedTimer", () => {
      overlay.init();
      overlay.showCopied("file.tsx:1");
      overlay.destroy();
      vi.advanceTimersByTime(2000);
      // no error — timer was cleared
    });

    it("is safe to call multiple times", () => {
      overlay.init();
      overlay.destroy();
      expect(() => overlay.destroy()).not.toThrow();
    });

    it("makes subsequent show/hide calls no-ops", () => {
      overlay.init();
      overlay.destroy();
      expect(() => overlay.show(makeElement(), makeInfo())).not.toThrow();
      expect(() => overlay.hide()).not.toThrow();
    });
  });
});
