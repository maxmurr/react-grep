import { beforeEach, describe, expect, it, vi } from "vitest";

describe("env", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("detects Mac via userAgentData.platform", async () => {
    vi.stubGlobal("navigator", { userAgentData: { platform: "macOS" }, userAgent: "" });
    const { isMac } = await import("../env");
    expect(isMac).toBe(true);
  });

  it("detects Mac via userAgent fallback when userAgentData is absent", async () => {
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)" });
    const { isMac } = await import("../env");
    expect(isMac).toBe(true);
  });

  it("returns false on Windows", async () => {
    vi.stubGlobal("navigator", {
      userAgentData: { platform: "Windows" },
      userAgent: "Mozilla/5.0 (Windows NT 10.0)",
    });
    const { isMac } = await import("../env");
    expect(isMac).toBe(false);
  });

  it("returns false when navigator is undefined", async () => {
    vi.stubGlobal("navigator", undefined);
    const { isMac } = await import("../env");
    expect(isMac).toBe(false);
  });

  it("returns false on Linux", async () => {
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (X11; Linux x86_64)" });
    const { isMac } = await import("../env");
    expect(isMac).toBe(false);
  });
});
