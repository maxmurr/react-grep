import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStart = vi.fn();
const mockStop = vi.fn();

function MockInspector() {}
MockInspector.prototype.start = mockStart;
MockInspector.prototype.stop = mockStop;

describe("index", () => {
  beforeEach(() => {
    vi.resetModules();
    mockStart.mockClear();
    mockStop.mockClear();
  });

  it("auto-initializes immediately when readyState is complete", async () => {
    Object.defineProperty(document, "readyState", { value: "complete", configurable: true });
    vi.doMock("../inspector", () => ({ Inspector: MockInspector }));

    await import("../index");
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it("init is idempotent - second call is no-op", async () => {
    Object.defineProperty(document, "readyState", { value: "complete", configurable: true });
    vi.doMock("../inspector", () => ({ Inspector: MockInspector }));

    const { init } = await import("../index");
    init();
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it("destroy stops inspector and allows re-init", async () => {
    Object.defineProperty(document, "readyState", { value: "complete", configurable: true });
    vi.doMock("../inspector", () => ({ Inspector: MockInspector }));

    const { destroy, init } = await import("../index");
    destroy();
    expect(mockStop).toHaveBeenCalledTimes(1);

    init();
    expect(mockStart).toHaveBeenCalledTimes(2);
  });

  it("destroy is no-op when not initialized", async () => {
    Object.defineProperty(document, "readyState", { value: "loading", configurable: true });
    vi.doMock("../inspector", () => ({ Inspector: MockInspector }));

    const { destroy } = await import("../index");
    destroy();
    expect(mockStop).not.toHaveBeenCalled();
    Object.defineProperty(document, "readyState", { value: "complete", configurable: true });
  });

  it("defers auto-init to DOMContentLoaded when readyState is loading", async () => {
    Object.defineProperty(document, "readyState", { value: "loading", configurable: true });
    const addSpy = vi.spyOn(document, "addEventListener");
    vi.doMock("../inspector", () => ({ Inspector: MockInspector }));

    await import("../index");
    expect(mockStart).not.toHaveBeenCalled();
    expect(addSpy).toHaveBeenCalledWith("DOMContentLoaded", expect.any(Function));

    const handler = addSpy.mock.calls.find((c) => c[0] === "DOMContentLoaded")![1] as EventListener;
    handler(new Event("DOMContentLoaded"));
    expect(mockStart).toHaveBeenCalledTimes(1);

    addSpy.mockRestore();
    Object.defineProperty(document, "readyState", { value: "complete", configurable: true });
  });
});
