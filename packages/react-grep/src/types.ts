export interface DebugSource {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
}

export interface Fiber {
  tag: number;
  type:
    | string
    | (Function & { displayName?: string })
    | { type: Function & { displayName?: string }; displayName?: string }
    | { render: Function & { displayName?: string }; displayName?: string }
    | null;
  return: Fiber | null;
  _debugSource?: DebugSource;
  _debugStack?: { stack: string };
  _debugOwner?: Fiber | null;
}

export type ElementKind = "component" | "element" | "children";

export interface ComponentInfo {
  kind: ElementKind;
  name: string;
  elementTag: string | null;
  source: DebugSource | null;
  callSite: DebugSource | null;
}
