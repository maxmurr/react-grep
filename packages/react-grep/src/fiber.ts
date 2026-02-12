import { resolveOriginalPosition } from "./source-map";
import type { ComponentInfo, DebugSource, Fiber } from "./types";

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

const getInnerFunction = (type: Fiber["type"]): (Function & { displayName?: string }) | null => {
  if (typeof type === "function") return type as Function & { displayName?: string };
  if (type && typeof type === "object") {
    if ("render" in type && typeof type.render === "function")
      return type.render as Function & { displayName?: string };
    if ("type" in type && typeof type.type === "function")
      return type.type as Function & { displayName?: string };
  }
  return null;
};

export const getComponentName = (fiber: Fiber): string => {
  const { type } = fiber;
  if (typeof type === "function") {
    return (type as Function & { displayName?: string }).displayName || type.name || "Anonymous";
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
  "react-stack-top-frame",
  "react_stack_bottom_frame",
]);

const FRAME_RE = /at (?:(\S+) )?\(?(.+):(\d+):(\d+)\)?$/;

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
    if (fnName && SKIP_FRAMES.has(fnName)) continue;
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
  if (fiber._debugOwner?._debugSource) return fiber._debugOwner._debugSource;

  const frame = parseFirstUserFrame(fiber);
  if (frame) return resolveFrame(frame);

  if (fiber._debugOwner) {
    const ownerFrame = parseFirstUserFrame(fiber._debugOwner);
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

  if (owner && owner === composite) {
    return {
      kind: "element",
      name: getComponentName(owner),
      elementTag,
      source: await getDomDebugSource(domFiber),
      callSite: await getCompositeDebugSource(composite),
    };
  }

  const nameSource = owner && COMPOSITE_TAGS.has(owner.tag) ? owner : composite;

  return {
    kind: "children",
    name: getComponentName(nameSource),
    elementTag,
    source: await getDomDebugSource(domFiber),
    callSite: null,
  };
};
