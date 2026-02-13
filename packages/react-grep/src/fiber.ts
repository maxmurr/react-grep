import { resolveOriginalPosition } from "./source-map";
import type { ComponentInfo, DebugSource, Fiber, ServerComponentOwner } from "./types";

const isServerComponent = (owner: Fiber | ServerComponentOwner): owner is ServerComponentOwner =>
  "env" in owner && typeof owner.name === "string";

const COMPOSITE_TAGS = new Set([
  0, // FunctionComponent
  1, // ClassComponent
  11, // ForwardRef
  14, // MemoComponent
  15, // SimpleMemoComponent
]);

export const getFiberFromElement = (el: Element): Fiber | null => {
  try {
    const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
    if (!key) return null;
    return (el as unknown as Record<string, unknown>)[key] as Fiber;
  } catch {
    return null;
  }
};

export const getCompositeComponentFiber = (fiber: Fiber): Fiber | null => {
  let current: Fiber | null = fiber;
  while (current) {
    if (COMPOSITE_TAGS.has(current.tag)) return current;
    current = current.return;
  }
  return null;
};

type NamedFn = ((...args: unknown[]) => unknown) & { displayName?: string; name: string };

/* v8 ignore start */
const getInnerFunction = (type: Fiber["type"]): NamedFn | null => {
  if (typeof type === "function") return type;
  if (type && typeof type === "object") {
    if ("render" in type && typeof type.render === "function") return type.render;
    if ("type" in type && typeof type.type === "function") return type.type;
  }
  return null;
};
/* v8 ignore stop */

export const getComponentName = (fiber: Fiber): string => {
  const { type } = fiber;
  if (typeof type === "function") {
    return type.displayName || type.name || "Anonymous";
  }
  if (type && typeof type === "object") {
    if ("displayName" in type && type.displayName) return type.displayName;
    const inner = getInnerFunction(type);
    if (inner) return inner.displayName || inner.name || "Anonymous";
  }
  return "Anonymous";
};

const SKIP_FRAMES = new Set([
  "jsxDEV",
  "jsxs",
  "jsx",
  "createElement",
  "react-stack-top-frame",
  "react_stack_bottom_frame",
  "fakeJSXCallSite",
]);

const FRAME_RE = /at (?:(.+) \()?(.+):(\d+):(\d+)\)?$/;

const isSkippedFn = (name: string): boolean => {
  if (SKIP_FRAMES.has(name)) return true;
  const dotIdx = name.lastIndexOf(".");
  if (dotIdx !== -1) {
    const base = name.substring(dotIdx + 1).replace(/\s*\[.*$/, "");
    if (SKIP_FRAMES.has(base)) return true;
  }
  const aliasMatch = /\[as (\w+)\]/.exec(name);
  return aliasMatch !== null && SKIP_FRAMES.has(aliasMatch[1]);
};

interface RawFrame {
  url: string;
  line: number;
  column: number;
}

const parseFirstUserFrame = (fiber: Fiber): RawFrame | null => {
  const stack = fiber._debugStack?.stack;
  if (!stack) return null;

  for (const line of stack.split("\n")) {
    const match = FRAME_RE.exec(line.trim());
    if (!match) continue;

    const [, fnName, url, lineStr, colStr] = match;
    if (fnName && isSkippedFn(fnName)) continue;
    if (url.includes("/node_modules/")) continue;

    return { url, line: Number(lineStr), column: Number(colStr) };
  }

  return null;
};

const resolveFrame = async (frame: RawFrame): Promise<DebugSource> => {
  const resolved = await resolveOriginalPosition(frame.url, frame.line, frame.column);
  if (resolved) return resolved;

  let fileName = frame.url;
  try {
    const parsed = new URL(frame.url);
    fileName = decodeURIComponent(parsed.pathname);
    const qIdx = fileName.indexOf("?");
    if (qIdx !== -1) fileName = fileName.substring(0, qIdx);
  } catch {
    // not a URL, use as-is
  }
  fileName = fileName.replace(/\.\.\//g, "");
  if (fileName.startsWith("/")) fileName = fileName.substring(1);

  return { fileName, lineNumber: frame.line, columnNumber: frame.column };
};

const getCompositeDebugSource = async (fiber: Fiber): Promise<DebugSource | null> => {
  if (fiber._debugSource) return fiber._debugSource;

  const owner = fiber._debugOwner;
  if (owner && !isServerComponent(owner) && owner._debugSource) return owner._debugSource;

  const frame = parseFirstUserFrame(fiber);
  if (frame) return resolveFrame(frame);

  if (owner && !isServerComponent(owner)) {
    const ownerFrame = parseFirstUserFrame(owner);
    if (ownerFrame) return resolveFrame(ownerFrame);
  }

  return null;
};

const getDomDebugSource = async (fiber: Fiber): Promise<DebugSource | null> => {
  if (fiber._debugSource) return fiber._debugSource;

  const frame = parseFirstUserFrame(fiber);
  if (frame) return resolveFrame(frame);

  return null;
};

export const getComponentInfo = async (el: Element): Promise<ComponentInfo | null> => {
  const domFiber = getFiberFromElement(el);
  if (!domFiber) return null;

  const composite = getCompositeComponentFiber(domFiber);
  if (!composite) return null;

  const isComponentRoot = domFiber.return != null && COMPOSITE_TAGS.has(domFiber.return.tag);

  if (isComponentRoot) {
    return {
      kind: "component",
      name: getComponentName(composite),
      elementTag: null,
      source: await getCompositeDebugSource(composite),
      callSite: null,
    };
  }

  const owner = domFiber._debugOwner;
  const elementTag = typeof domFiber.type === "string" ? domFiber.type : null;

  if (owner && !isServerComponent(owner) && owner === composite) {
    return {
      kind: "element",
      name: getComponentName(owner),
      elementTag,
      source: await getDomDebugSource(domFiber),
      callSite: await getCompositeDebugSource(composite),
    };
  }

  const name =
    owner && isServerComponent(owner)
      ? owner.name
      : getComponentName(
          owner && !isServerComponent(owner) && COMPOSITE_TAGS.has(owner.tag) ? owner : composite,
        );

  return {
    kind: "children",
    name,
    elementTag,
    source: await getDomDebugSource(domFiber),
    callSite: null,
  };
};
