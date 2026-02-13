import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../env", () => ({ isMac: false }));
vi.mock("../fiber", () => ({ getComponentInfo: vi.fn() }));
vi.mock("../overlay", () => {
  const OverlayManager = vi.fn();
  OverlayManager.prototype.init = vi.fn();
  OverlayManager.prototype.show = vi.fn();
  OverlayManager.prototype.showCopied = vi.fn();
  OverlayManager.prototype.hide = vi.fn();
  OverlayManager.prototype.destroy = vi.fn();
  return { OverlayManager };
});

import { getComponentInfo } from "../fiber";
import { OverlayManager } from "../overlay";
import { Inspector } from "../inspector";
import type { ComponentInfo } from "../types";

const mockGetComponentInfo = vi.mocked(getComponentInfo);
const overlay = OverlayManager.prototype;

const tick = () => new Promise<void>((r) => queueMicrotask(r));

const makeInfo = (overrides: Partial<ComponentInfo> = {}): ComponentInfo => ({
  kind: "component",
  name: "Button",
  elementTag: null,
  source: { fileName: "button.tsx", lineNumber: 10 },
  callSite: null,
  ...overrides,
});

describe("Inspector", () => {
  let inspector: Inspector;
  let mockElementFromPoint: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    inspector = new Inspector();
    inspector.start();
    mockGetComponentInfo.mockReset();
    vi.mocked(overlay.init).mockClear();
    vi.mocked(overlay.show).mockClear();
    vi.mocked(overlay.showCopied).mockClear();
    vi.mocked(overlay.hide).mockClear();
    vi.mocked(overlay.destroy).mockClear();

    mockElementFromPoint = vi.fn().mockReturnValue(null);
    document.elementFromPoint = mockElementFromPoint as unknown as typeof document.elementFromPoint;

    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      userAgent: "",
    });
  });

  afterEach(() => {
    inspector.stop();
    vi.unstubAllGlobals();
  });

  describe("start/stop", () => {
    it("registers event listeners on start", () => {
      const spy = vi.spyOn(window, "addEventListener");
      const i = new Inspector();
      i.start();
      const events = spy.mock.calls.map((c) => c[0]);
      expect(events).toContain("mousemove");
      expect(events).toContain("click");
      expect(events).toContain("keydown");
      expect(events).toContain("keyup");
      i.stop();
      spy.mockRestore();
    });

    it("removes listeners and cleans up on stop", () => {
      const spy = vi.spyOn(window, "removeEventListener");
      inspector.stop();
      const events = spy.mock.calls.map((c) => c[0]);
      expect(events).toContain("mousemove");
      expect(events).toContain("click");
      expect(events).toContain("keydown");
      expect(events).toContain("keyup");
      expect(overlay.destroy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("handleMouseMove", () => {
    it("hides overlay and restores cursor when modifier not held", async () => {
      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: false }));
      await tick();
      expect(overlay.hide).toHaveBeenCalled();
    });

    it("ignores react-grep elements", async () => {
      const target = document.createElement("div");
      target.dataset.reactGrep = "highlight";
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);

      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      await tick();
      expect(mockGetComponentInfo).not.toHaveBeenCalled();
      target.remove();
    });

    it("ignores null target from elementFromPoint", async () => {
      mockElementFromPoint.mockReturnValue(null);
      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      await tick();
      expect(mockGetComponentInfo).not.toHaveBeenCalled();
    });

    it("shows overlay with component info when modifier held", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);
      mockGetComponentInfo.mockResolvedValue(makeInfo());

      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      await tick();
      await tick();

      expect(overlay.init).toHaveBeenCalled();
      expect(overlay.show).toHaveBeenCalledWith(target, makeInfo(), "source");
      target.remove();
    });

    it("hides overlay when getComponentInfo returns null", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);
      mockGetComponentInfo.mockResolvedValue(null);

      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      await tick();
      await tick();

      expect(overlay.hide).toHaveBeenCalled();
      target.remove();
    });

    it("discards stale move results via generation counter", async () => {
      const target1 = document.createElement("div");
      const target2 = document.createElement("p");
      document.body.appendChild(target1);
      document.body.appendChild(target2);

      let resolveFirst!: (v: ComponentInfo | null) => void;
      const firstPromise = new Promise<ComponentInfo | null>((r) => (resolveFirst = r));

      mockElementFromPoint.mockReturnValueOnce(target1).mockReturnValueOnce(target2);
      mockGetComponentInfo
        .mockReturnValueOnce(firstPromise)
        .mockResolvedValueOnce(makeInfo({ name: "Second" }));

      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));

      await tick();
      await tick();

      resolveFirst(makeInfo({ name: "Stale" }));
      await tick();
      await tick();

      const showCalls = vi.mocked(overlay.show).mock.calls;
      expect(showCalls.every((c) => c[1].name !== "Stale")).toBe(true);

      target1.remove();
      target2.remove();
    });

    it("resets sourceToggled when target changes", async () => {
      const target1 = document.createElement("div");
      const target2 = document.createElement("p");
      document.body.appendChild(target1);
      document.body.appendChild(target2);

      const info = makeInfo({
        source: { fileName: "a.tsx", lineNumber: 1 },
        callSite: { fileName: "b.tsx", lineNumber: 2 },
      });

      mockElementFromPoint.mockReturnValue(target1);
      mockGetComponentInfo.mockResolvedValue(info);
      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      await tick();
      await tick();

      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", ctrlKey: true }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift", ctrlKey: true }));

      mockElementFromPoint.mockReturnValue(target2);
      mockGetComponentInfo.mockResolvedValue(info);
      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      await tick();
      await tick();

      const lastShowCall = vi.mocked(overlay.show).mock.calls.at(-1)!;
      expect(lastShowCall[2]).toBe("source");

      target1.remove();
      target2.remove();
    });

    it("sets crosshair cursor when modifier held", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);
      mockGetComponentInfo.mockResolvedValue(makeInfo());

      document.body.style.cursor = "default";
      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      await tick();

      expect(document.body.style.cursor).toBe("crosshair");
      target.remove();
    });

    it("restores cursor when modifier released", async () => {
      document.body.style.cursor = "pointer";
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);
      mockGetComponentInfo.mockResolvedValue(makeInfo());

      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      await tick();
      await tick();

      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: false }));
      await tick();

      expect(document.body.style.cursor).toBe("pointer");
      target.remove();
    });
  });

  describe("handleClick", () => {
    it("ignores click without modifier", async () => {
      window.dispatchEvent(
        new MouseEvent("click", { ctrlKey: false, shiftKey: true, bubbles: true }),
      );
      await tick();
      expect(mockGetComponentInfo).not.toHaveBeenCalled();
    });

    it("ignores click without shift", async () => {
      window.dispatchEvent(
        new MouseEvent("click", { ctrlKey: true, shiftKey: false, bubbles: true }),
      );
      await tick();
      expect(mockGetComponentInfo).not.toHaveBeenCalled();
    });

    it("ignores click on react-grep element", async () => {
      const target = document.createElement("div");
      target.dataset.reactGrep = "tooltip";
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);

      window.dispatchEvent(
        new MouseEvent("click", { ctrlKey: true, shiftKey: true, bubbles: true }),
      );
      await tick();
      expect(mockGetComponentInfo).not.toHaveBeenCalled();
      target.remove();
    });

    it("ignores click on null target", async () => {
      mockElementFromPoint.mockReturnValue(null);
      window.dispatchEvent(
        new MouseEvent("click", { ctrlKey: true, shiftKey: true, bubbles: true }),
      );
      await tick();
      expect(mockGetComponentInfo).not.toHaveBeenCalled();
    });

    it("prevents default and stops propagation", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);
      mockGetComponentInfo.mockResolvedValue(makeInfo());

      const event = new MouseEvent("click", { ctrlKey: true, shiftKey: true, bubbles: true });
      const spyPrevent = vi.spyOn(event, "preventDefault");
      const spyStop = vi.spyOn(event, "stopPropagation");
      const spyImmediate = vi.spyOn(event, "stopImmediatePropagation");

      window.dispatchEvent(event);
      await tick();

      expect(spyPrevent).toHaveBeenCalled();
      expect(spyStop).toHaveBeenCalled();
      expect(spyImmediate).toHaveBeenCalled();
      target.remove();
    });

    it("copies location with columnNumber to clipboard", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);
      mockGetComponentInfo.mockResolvedValue(
        makeInfo({ source: { fileName: "comp.tsx", lineNumber: 10, columnNumber: 5 } }),
      );

      window.dispatchEvent(
        new MouseEvent("click", { ctrlKey: true, shiftKey: true, bubbles: true }),
      );
      await tick();
      await tick();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("comp.tsx:10:5");
      expect(overlay.showCopied).toHaveBeenCalledWith("comp.tsx:10:5");
      target.remove();
    });

    it("copies location without columnNumber", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);
      mockGetComponentInfo.mockResolvedValue(
        makeInfo({ source: { fileName: "comp.tsx", lineNumber: 10 } }),
      );

      window.dispatchEvent(
        new MouseEvent("click", { ctrlKey: true, shiftKey: true, bubbles: true }),
      );
      await tick();
      await tick();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("comp.tsx:10");
      target.remove();
    });

    it("handles null source gracefully", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);
      mockGetComponentInfo.mockResolvedValue(makeInfo({ source: null }));

      window.dispatchEvent(
        new MouseEvent("click", { ctrlKey: true, shiftKey: true, bubbles: true }),
      );
      await tick();
      await tick();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
      target.remove();
    });

    it("discards stale click results", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);

      let resolveFirst!: (v: ComponentInfo | null) => void;
      const firstPromise = new Promise<ComponentInfo | null>((r) => (resolveFirst = r));
      mockGetComponentInfo.mockReturnValueOnce(firstPromise).mockResolvedValueOnce(makeInfo());

      window.dispatchEvent(
        new MouseEvent("click", { ctrlKey: true, shiftKey: true, bubbles: true }),
      );
      window.dispatchEvent(
        new MouseEvent("click", { ctrlKey: true, shiftKey: true, bubbles: true }),
      );

      await tick();
      await tick();

      resolveFirst(makeInfo({ name: "Stale" }));
      await tick();
      await tick();

      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
      target.remove();
    });

    it("handles null from getComponentInfo", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);
      mockGetComponentInfo.mockResolvedValue(null);

      window.dispatchEvent(
        new MouseEvent("click", { ctrlKey: true, shiftKey: true, bubbles: true }),
      );
      await tick();
      await tick();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
      target.remove();
    });

    it("silently catches clipboard write failures", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);
      mockGetComponentInfo.mockResolvedValue(makeInfo());
      vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error("denied"));

      window.dispatchEvent(
        new MouseEvent("click", { ctrlKey: true, shiftKey: true, bubbles: true }),
      );
      await tick();
      await tick();
      await tick();

      expect(overlay.showCopied).toHaveBeenCalled();
      target.remove();
    });
  });

  describe("handleKeyDown", () => {
    it("sets shiftPressedClean when shift pressed with modifier", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", ctrlKey: true }));
    });

    it("does not set shiftPressedClean without modifier", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", ctrlKey: false }));
    });
  });

  describe("handleKeyUp", () => {
    it("hides overlay on Control release (non-Mac)", () => {
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "Control" }));
      expect(overlay.hide).toHaveBeenCalled();
    });

    it("toggles source/callSite on clean shift release", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);
      const info = makeInfo({
        source: { fileName: "a.tsx", lineNumber: 1 },
        callSite: { fileName: "b.tsx", lineNumber: 2 },
      });
      mockGetComponentInfo.mockResolvedValue(info);

      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      await tick();
      await tick();

      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", ctrlKey: true }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift", ctrlKey: true }));

      const lastShow = vi.mocked(overlay.show).mock.calls.at(-1)!;
      expect(lastShow[2]).toBe("callSite");

      target.remove();
    });

    it("does not toggle when no callSite exists", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);
      mockGetComponentInfo.mockResolvedValue(makeInfo({ callSite: null }));

      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      await tick();
      await tick();

      const callsBefore = vi.mocked(overlay.show).mock.calls.length;
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", ctrlKey: true }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift", ctrlKey: true }));

      expect(vi.mocked(overlay.show).mock.calls.length).toBe(callsBefore);
      target.remove();
    });

    it("does not toggle when shiftPressedClean is false", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);
      mockGetComponentInfo.mockResolvedValue(
        makeInfo({ callSite: { fileName: "b.tsx", lineNumber: 2 } }),
      );

      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      await tick();
      await tick();

      const callsBefore = vi.mocked(overlay.show).mock.calls.length;
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift", ctrlKey: true }));

      expect(vi.mocked(overlay.show).mock.calls.length).toBe(callsBefore);
      target.remove();
    });

    it("resets shiftPressedClean after keyup", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);
      mockGetComponentInfo.mockResolvedValue(
        makeInfo({ callSite: { fileName: "b.tsx", lineNumber: 2 } }),
      );

      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      await tick();
      await tick();

      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", ctrlKey: true }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift", ctrlKey: true }));

      const callsBefore = vi.mocked(overlay.show).mock.calls.length;
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift", ctrlKey: true }));
      expect(vi.mocked(overlay.show).mock.calls.length).toBe(callsBefore);

      target.remove();
    });
  });

  describe("Mac mode", () => {
    it("uses metaKey on Mac", async () => {
      vi.resetModules();
      vi.doMock("../env", () => ({ isMac: true }));
      vi.doMock("../fiber", () => ({ getComponentInfo: vi.fn() }));
      vi.doMock("../overlay", () => {
        const OM = vi.fn();
        OM.prototype.init = vi.fn();
        OM.prototype.show = vi.fn();
        OM.prototype.showCopied = vi.fn();
        OM.prototype.hide = vi.fn();
        OM.prototype.destroy = vi.fn();
        return { OverlayManager: OM };
      });

      const { Inspector: MacInspector } = await import("../inspector");
      const { getComponentInfo: macGetInfo } = await import("../fiber");
      const { OverlayManager: MacOverlay } = await import("../overlay");

      const macInspector = new MacInspector();
      macInspector.start();

      document.elementFromPoint = vi.fn().mockReturnValue(null);

      window.dispatchEvent(new MouseEvent("mousemove", { metaKey: false, ctrlKey: true }));
      await tick();
      expect(MacOverlay.prototype.hide).toHaveBeenCalled();

      vi.mocked(MacOverlay.prototype.hide).mockClear();

      const target = document.createElement("div");
      document.body.appendChild(target);
      (document.elementFromPoint as ReturnType<typeof vi.fn>).mockReturnValue(target);
      vi.mocked(macGetInfo).mockResolvedValue(makeInfo());

      window.dispatchEvent(new MouseEvent("mousemove", { metaKey: true }));
      await tick();
      await tick();

      expect(MacOverlay.prototype.show).toHaveBeenCalled();

      window.dispatchEvent(new KeyboardEvent("keyup", { key: "Meta" }));
      expect(MacOverlay.prototype.hide).toHaveBeenCalled();

      macInspector.stop();
      target.remove();
    });
  });

  describe("cursor management", () => {
    it("does not re-save cursor when already crosshair", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);
      mockGetComponentInfo.mockResolvedValue(makeInfo());

      document.body.style.cursor = "pointer";
      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      await tick();
      expect(document.body.style.cursor).toBe("crosshair");

      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      await tick();
      expect(document.body.style.cursor).toBe("crosshair");

      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: false }));
      await tick();
      expect(document.body.style.cursor).toBe("pointer");

      target.remove();
    });

    it("does not restore cursor when not crosshair", () => {
      document.body.style.cursor = "default";
      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: false }));
      expect(document.body.style.cursor).toBe("default");
    });
  });

  describe("getActiveCopySource", () => {
    it("returns callSite when toggled and callSite exists", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);
      const info = makeInfo({
        source: { fileName: "source.tsx", lineNumber: 1 },
        callSite: { fileName: "callsite.tsx", lineNumber: 2 },
      });
      mockGetComponentInfo.mockResolvedValue(info);

      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      await tick();
      await tick();

      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", ctrlKey: true }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift", ctrlKey: true }));

      window.dispatchEvent(
        new MouseEvent("click", { ctrlKey: true, shiftKey: true, bubbles: true }),
      );
      await tick();
      await tick();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("callsite.tsx:2");
      target.remove();
    });

    it("falls back to source when toggled but callSite is null", async () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      mockElementFromPoint.mockReturnValue(target);

      const infoWithCallSite = makeInfo({
        source: { fileName: "source.tsx", lineNumber: 1 },
        callSite: { fileName: "callsite.tsx", lineNumber: 2 },
      });
      mockGetComponentInfo.mockResolvedValue(infoWithCallSite);

      window.dispatchEvent(new MouseEvent("mousemove", { ctrlKey: true }));
      await tick();
      await tick();

      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", ctrlKey: true }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift", ctrlKey: true }));

      const infoNoCallSite = makeInfo({
        source: { fileName: "source.tsx", lineNumber: 1 },
        callSite: null,
      });
      mockGetComponentInfo.mockResolvedValue(infoNoCallSite);

      window.dispatchEvent(
        new MouseEvent("click", { ctrlKey: true, shiftKey: true, bubbles: true }),
      );
      await tick();
      await tick();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("source.tsx:1");
      target.remove();
    });
  });
});
