export interface DebugSource {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
}

export interface ServerComponentOwner {
  name: string;
  env: string;
}

type AnyFn = ((...args: unknown[]) => unknown) & { displayName?: string; name: string };

export interface Fiber {
  tag: number;
  type:
    | string
    | AnyFn
    | { type: AnyFn; displayName?: string }
    | { render: AnyFn; displayName?: string }
    | null;
  return: Fiber | null;
  _debugSource?: DebugSource;
  _debugStack?: { stack: string };
  _debugOwner?: Fiber | ServerComponentOwner | null;
}

export type ElementKind = "component" | "element" | "children";

export interface ComponentInfo {
  kind: ElementKind;
  name: string;
  elementTag: string | null;
  source: DebugSource | null;
  callSite: DebugSource | null;
}
