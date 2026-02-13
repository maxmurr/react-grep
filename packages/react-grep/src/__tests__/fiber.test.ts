import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../source-map", () => ({
  resolveOriginalPosition: vi.fn(),
}));

import { resolveOriginalPosition } from "../source-map";
import {
  getComponentInfo,
  getComponentName,
  getCompositeComponentFiber,
  getFiberFromElement,
} from "../fiber";
import type { Fiber, ServerComponentOwner } from "../types";

type NamedFn = ((...args: unknown[]) => unknown) & { displayName?: string; name: string };

const mockResolve = vi.mocked(resolveOriginalPosition);

const makeFiber = (overrides: Partial<Fiber> = {}): Fiber => ({
  tag: 0,
  type: Object.assign(function MyComponent() {}, { displayName: undefined as string | undefined }),
  return: null,
  ...overrides,
});

const makeDomFiber = (overrides: Partial<Fiber> = {}): Fiber => ({
  tag: 5,
  type: "div",
  return: null,
  ...overrides,
});

const makeElementWithFiber = (fiber: Fiber): Element => {
  const el = document.createElement("div");
  const key = `__reactFiber$test123`;
  Object.defineProperty(el, key, { value: fiber, configurable: true, enumerable: true });
  return el;
};

const makeAnonymousFn = (): NamedFn => {
  const fn = () => {};
  Object.defineProperty(fn, "name", { value: "" });
  Object.defineProperty(fn, "displayName", { value: undefined });
  return fn as NamedFn;
};

describe("fiber", () => {
  beforeEach(() => {
    mockResolve.mockReset();
  });

  describe("getFiberFromElement", () => {
    it("returns fiber when __reactFiber$ property exists", () => {
      const fiber = makeFiber();
      const el = makeElementWithFiber(fiber);
      expect(getFiberFromElement(el)).toBe(fiber);
    });

    it("returns null when no fiber key exists", () => {
      const el = document.createElement("div");
      expect(getFiberFromElement(el)).toBeNull();
    });

    it("returns null when Object.keys throws", () => {
      const el = document.createElement("div");
      const original = Object.keys;
      Object.keys = () => {
        throw new Error("fail");
      };
      expect(getFiberFromElement(el)).toBeNull();
      Object.keys = original;
    });
  });

  describe("getCompositeComponentFiber", () => {
    it.each([
      [0, "FunctionComponent"],
      [1, "ClassComponent"],
      [11, "ForwardRef"],
      [14, "MemoComponent"],
      [15, "SimpleMemoComponent"],
    ] as const)("returns fiber with tag %d (%s)", (tag, _name) => {
      const fiber = makeFiber({ tag });
      expect(getCompositeComponentFiber(fiber)).toBe(fiber);
    });

    it("walks up return chain to find composite parent", () => {
      const parent = makeFiber({ tag: 0 });
      const child = makeDomFiber({ return: parent });
      expect(getCompositeComponentFiber(child)).toBe(parent);
    });

    it("returns null when no composite found", () => {
      const fiber = makeDomFiber({ return: makeDomFiber() });
      expect(getCompositeComponentFiber(fiber)).toBeNull();
    });
  });

  describe("getComponentName", () => {
    it("returns displayName from function type", () => {
      const fn = Object.assign(() => {}, { displayName: "MyButton" }) as NamedFn;
      expect(getComponentName(makeFiber({ type: fn }))).toBe("MyButton");
    });

    it("returns name from function type", () => {
      function NamedFunc() {}
      expect(getComponentName(makeFiber({ type: NamedFunc as unknown as NamedFn }))).toBe(
        "NamedFunc",
      );
    });

    it("returns Anonymous for unnamed function", () => {
      expect(getComponentName(makeFiber({ type: makeAnonymousFn() }))).toBe("Anonymous");
    });

    it("returns displayName from object type", () => {
      const type = { displayName: "WrappedButton", type: (() => {}) as NamedFn };
      expect(getComponentName(makeFiber({ type }))).toBe("WrappedButton");
    });

    it("returns name from object.render function", () => {
      const type = { render: Object.assign(function RenderFn() {}, {}) as NamedFn };
      expect(getComponentName(makeFiber({ type }))).toBe("RenderFn");
    });

    it("returns displayName from object.render function", () => {
      const render = Object.assign(() => {}, { displayName: "ForwardedBtn" }) as NamedFn;
      const type = { render };
      expect(getComponentName(makeFiber({ type }))).toBe("ForwardedBtn");
    });

    it("returns name from object.type function", () => {
      const type = { type: Object.assign(function TypeFn() {}, {}) as NamedFn };
      expect(getComponentName(makeFiber({ type }))).toBe("TypeFn");
    });

    it("returns Anonymous for object with anonymous inner function", () => {
      const type = { type: makeAnonymousFn() };
      expect(getComponentName(makeFiber({ type }))).toBe("Anonymous");
    });

    it("returns Anonymous for object without render or type functions", () => {
      const type = { someOtherProp: true } as unknown as Fiber["type"];
      expect(getComponentName(makeFiber({ type }))).toBe("Anonymous");
    });

    it("returns Anonymous for null type", () => {
      expect(getComponentName(makeFiber({ type: null }))).toBe("Anonymous");
    });

    it("returns Anonymous for string type", () => {
      expect(getComponentName(makeFiber({ type: "div" }))).toBe("Anonymous");
    });
  });

  describe("getComponentInfo", () => {
    it("returns null when element has no fiber", async () => {
      const el = document.createElement("div");
      expect(await getComponentInfo(el)).toBeNull();
    });

    it("returns null when no composite ancestor exists", async () => {
      const fiber = makeDomFiber();
      const el = makeElementWithFiber(fiber);
      expect(await getComponentInfo(el)).toBeNull();
    });

    it("returns component kind when element is component root", async () => {
      const composite = makeFiber({
        tag: 0,
        type: Object.assign(function Button() {}, {}) as NamedFn,
        _debugSource: { fileName: "button.tsx", lineNumber: 5 },
      });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info).toEqual({
        kind: "component",
        name: "Button",
        elementTag: null,
        source: { fileName: "button.tsx", lineNumber: 5 },
        callSite: null,
      });
    });

    it("returns element kind when owner equals composite", async () => {
      const composite = makeFiber({
        tag: 0,
        type: Object.assign(function Card() {}, {}) as NamedFn,
        _debugSource: { fileName: "card.tsx", lineNumber: 10 },
      });
      // domFiber.return is a non-composite (tag 5), so isComponentRoot = false
      // composite is found further up the chain
      const domFiber = makeDomFiber({
        return: makeDomFiber({ tag: 5, return: composite }),
        _debugOwner: composite,
        _debugSource: { fileName: "card.tsx", lineNumber: 15 },
      });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.kind).toBe("element");
      expect(info!.name).toBe("Card");
      expect(info!.elementTag).toBe("div");
      expect(info!.source).toEqual({ fileName: "card.tsx", lineNumber: 15 });
      expect(info!.callSite).toEqual({ fileName: "card.tsx", lineNumber: 10 });
    });

    it("returns children kind with server component owner name", async () => {
      const serverOwner: ServerComponentOwner = { name: "ServerLayout", env: "Server" };
      const composite = makeFiber({ tag: 0 });
      const domFiber = makeDomFiber({
        return: makeDomFiber({ tag: 5, return: composite }),
        _debugOwner: serverOwner,
      });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.kind).toBe("children");
      expect(info!.name).toBe("ServerLayout");
    });

    it("returns children kind using composite owner name when owner is composite", async () => {
      const owner = makeFiber({
        tag: 0,
        type: Object.assign(function Layout() {}, {}) as NamedFn,
      });
      const composite = makeFiber({ tag: 0, return: null });
      const domFiber = makeDomFiber({
        return: makeDomFiber({ tag: 5, return: composite }),
        _debugOwner: owner,
      });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.kind).toBe("children");
      expect(info!.name).toBe("Layout");
    });

    it("returns children kind using composite name when owner is non-composite", async () => {
      const owner = makeFiber({ tag: 5 });
      const composite = makeFiber({
        tag: 0,
        type: Object.assign(function App() {}, {}) as NamedFn,
      });
      const domFiber = makeDomFiber({
        return: makeDomFiber({ tag: 5, return: composite }),
        _debugOwner: owner,
      });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.kind).toBe("children");
      expect(info!.name).toBe("App");
    });

    it("returns children kind using composite name when owner is null", async () => {
      const composite = makeFiber({
        tag: 0,
        type: Object.assign(function Root() {}, {}) as NamedFn,
      });
      const domFiber = makeDomFiber({
        return: makeDomFiber({ tag: 5, return: composite }),
        _debugOwner: null,
      });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.kind).toBe("children");
      expect(info!.name).toBe("Root");
    });

    it("extracts elementTag from string fiber type", async () => {
      const composite = makeFiber({ tag: 0 });
      const domFiber: Fiber = {
        tag: 5,
        type: "span",
        return: makeDomFiber({ tag: 5, return: composite }),
        _debugOwner: null,
      };
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.elementTag).toBe("span");
    });

    it("returns null elementTag for non-string fiber type", async () => {
      const composite = makeFiber({ tag: 0 });
      const domFiber: Fiber = {
        tag: 5,
        type: (() => {}) as NamedFn,
        return: makeDomFiber({ tag: 5, return: composite }),
        _debugOwner: null,
      };
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.elementTag).toBeNull();
    });
  });

  describe("debug source resolution", () => {
    it("uses _debugSource directly when available on composite", async () => {
      const composite = makeFiber({
        tag: 0,
        _debugSource: { fileName: "direct.tsx", lineNumber: 1 },
      });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.source).toEqual({ fileName: "direct.tsx", lineNumber: 1 });
    });

    it("falls back to owner _debugSource when composite has none", async () => {
      const owner = makeFiber({
        tag: 0,
        _debugSource: { fileName: "owner.tsx", lineNumber: 5 },
      });
      const composite = makeFiber({
        tag: 0,
        _debugOwner: owner,
      });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.source).toEqual({ fileName: "owner.tsx", lineNumber: 5 });
    });

    it("skips server component owner and parses stack frame", async () => {
      const serverOwner: ServerComponentOwner = { name: "ServerComp", env: "Server" };
      mockResolve.mockResolvedValue({ fileName: "resolved.tsx", lineNumber: 42 });
      const composite = makeFiber({
        tag: 0,
        _debugOwner: serverOwner,
        _debugStack: {
          stack: `Error\n    at MyComponent (http://localhost:3000/src/comp.tsx:10:5)`,
        },
      });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(mockResolve).toHaveBeenCalled();
      expect(info!.source).toEqual({ fileName: "resolved.tsx", lineNumber: 42 });
    });

    it("falls back to owner stack frame when fiber has no stack", async () => {
      const owner = makeFiber({
        tag: 0,
        _debugStack: {
          stack: `Error\n    at OwnerComp (http://localhost:3000/src/owner.tsx:20:3)`,
        },
      });
      mockResolve.mockResolvedValue({ fileName: "owner-resolved.tsx", lineNumber: 20 });
      const composite = makeFiber({
        tag: 0,
        _debugOwner: owner,
      });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.source).toEqual({ fileName: "owner-resolved.tsx", lineNumber: 20 });
    });

    it("returns null source when no debug info exists", async () => {
      const composite = makeFiber({ tag: 0 });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.source).toBeNull();
    });

    it("returns null when owner has no parseable stack frame", async () => {
      const owner = makeFiber({
        tag: 0,
        _debugStack: { stack: "Error\n    not a frame" },
      });
      const composite = makeFiber({
        tag: 0,
        _debugOwner: owner,
      });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.source).toBeNull();
    });

    it("uses _debugSource on dom fiber for element kind", async () => {
      const composite = makeFiber({
        tag: 0,
        type: Object.assign(function Comp() {}, {}) as NamedFn,
        _debugSource: { fileName: "comp.tsx", lineNumber: 1 },
      });
      const domFiber = makeDomFiber({
        return: makeDomFiber({ tag: 5, return: composite }),
        _debugOwner: composite,
        _debugSource: { fileName: "comp.tsx", lineNumber: 8 },
      });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.source).toEqual({ fileName: "comp.tsx", lineNumber: 8 });
    });

    it("resolves dom fiber stack frame when no _debugSource", async () => {
      mockResolve.mockResolvedValue({ fileName: "dom-resolved.tsx", lineNumber: 15 });
      const composite = makeFiber({ tag: 0 });
      const domFiber = makeDomFiber({
        return: makeDomFiber({ tag: 5, return: composite }),
        _debugOwner: null,
        _debugStack: {
          stack: `Error\n    at render (http://localhost:3000/src/dom.tsx:15:10)`,
        },
      });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.source).toEqual({ fileName: "dom-resolved.tsx", lineNumber: 15 });
    });

    it("returns null dom source when no debug info exists", async () => {
      const composite = makeFiber({ tag: 0 });
      const domFiber = makeDomFiber({
        return: makeDomFiber({ tag: 5, return: composite }),
        _debugOwner: null,
      });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.source).toBeNull();
    });
  });

  describe("parseFirstUserFrame", () => {
    it("returns null when _debugStack is absent", async () => {
      const composite = makeFiber({ tag: 0 });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.source).toBeNull();
      expect(mockResolve).not.toHaveBeenCalled();
    });

    it("skips React internal frames", async () => {
      mockResolve.mockResolvedValue({ fileName: "user.tsx", lineNumber: 5 });
      const composite = makeFiber({
        tag: 0,
        _debugStack: {
          stack: [
            "Error",
            "    at jsxDEV (http://localhost/react.js:1:1)",
            "    at jsxs (http://localhost/react.js:2:1)",
            "    at jsx (http://localhost/react.js:3:1)",
            "    at react-stack-top-frame (http://localhost/react.js:4:1)",
            "    at react_stack_bottom_frame (http://localhost/react.js:5:1)",
            "    at fakeJSXCallSite (http://localhost/react.js:6:1)",
            "    at UserComp (http://localhost:3000/src/user.tsx:5:1)",
          ].join("\n"),
        },
      });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      await getComponentInfo(el);
      expect(mockResolve).toHaveBeenCalledWith("http://localhost:3000/src/user.tsx", 5, 1);
    });

    it("skips node_modules frames", async () => {
      mockResolve.mockResolvedValue({ fileName: "app.tsx", lineNumber: 10 });
      const composite = makeFiber({
        tag: 0,
        _debugStack: {
          stack: [
            "Error",
            "    at Lib (http://localhost/node_modules/lib/index.js:1:1)",
            "    at App (http://localhost:3000/src/app.tsx:10:5)",
          ].join("\n"),
        },
      });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      await getComponentInfo(el);
      expect(mockResolve).toHaveBeenCalledWith("http://localhost:3000/src/app.tsx", 10, 5);
    });

    it("handles anonymous frames (no function name)", async () => {
      mockResolve.mockResolvedValue({ fileName: "anon.tsx", lineNumber: 3 });
      const composite = makeFiber({
        tag: 0,
        _debugStack: {
          stack: `Error\n    at http://localhost:3000/src/anon.tsx:3:7`,
        },
      });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      await getComponentInfo(el);
      expect(mockResolve).toHaveBeenCalledWith("http://localhost:3000/src/anon.tsx", 3, 7);
    });

    it("returns null when stack has no matching frames", async () => {
      const composite = makeFiber({
        tag: 0,
        _debugStack: { stack: "Error\n    not a real frame" },
      });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.source).toBeNull();
    });
  });

  describe("resolveFrame", () => {
    it("returns resolved source when source map succeeds", async () => {
      mockResolve.mockResolvedValue({
        fileName: "original.tsx",
        lineNumber: 42,
        columnNumber: 10,
      });
      const composite = makeFiber({
        tag: 0,
        _debugStack: {
          stack: `Error\n    at Comp (http://localhost:3000/src/comp.tsx:100:20)`,
        },
      });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.source).toEqual({
        fileName: "original.tsx",
        lineNumber: 42,
        columnNumber: 10,
      });
    });

    it("falls back to URL pathname when source map returns null", async () => {
      mockResolve.mockResolvedValue(null);
      const composite = makeFiber({
        tag: 0,
        _debugStack: {
          stack: `Error\n    at Comp (http://localhost:3000/src/comp.tsx?v=123:50:10)`,
        },
      });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.source!.fileName).toBe("src/comp.tsx");
      expect(info!.source!.lineNumber).toBe(50);
    });

    it("strips ../ and leading / from fallback path", async () => {
      mockResolve.mockResolvedValue(null);
      const composite = makeFiber({
        tag: 0,
        _debugStack: {
          stack: `Error\n    at Comp (http://localhost:3000/../../src/file.tsx:1:1)`,
        },
      });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.source!.fileName).toBe("src/file.tsx");
    });

    it("strips query params from decoded pathname", async () => {
      mockResolve.mockResolvedValue(null);
      const composite = makeFiber({
        tag: 0,
        _debugStack: {
          stack: `Error\n    at Comp (http://localhost:3000/src/file%3Fquery.tsx:1:1)`,
        },
      });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.source!.fileName).toBe("src/file");
    });

    it("uses raw URL as fileName when URL parsing fails", async () => {
      mockResolve.mockResolvedValue(null);
      const composite = makeFiber({
        tag: 0,
        _debugStack: {
          stack: `Error\n    at Comp (not-a-url:1:1)`,
        },
      });
      const domFiber = makeDomFiber({ return: composite });
      const el = makeElementWithFiber(domFiber);

      const info = await getComponentInfo(el);
      expect(info!.source!.fileName).toBe("not-a-url");
    });
  });
});
