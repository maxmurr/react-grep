import type { DebugSource } from "./types";

interface SourceMapData {
  sources: string[];
  mappings: Segment[][];
}

type Segment = [genCol: number, srcIdx: number, origLine: number, origCol: number];

const cache = new Map<string, Promise<SourceMapData | null>>();

const VLQ_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const charToInt: number[] = [];
for (let i = 0; i < VLQ_CHARS.length; i++) charToInt[VLQ_CHARS.charCodeAt(i)] = i;

const decodeVLQ = (str: string, pos: { i: number }): number => {
  let shift = 0;
  let value = 0;
  while (pos.i < str.length) {
    const digit = charToInt[str.charCodeAt(pos.i++)];
    value += (digit & 31) << shift;
    if (!(digit & 32)) return value & 1 ? -(value >> 1) : value >> 1;
    shift += 5;
  }
  return 0;
};

const decodeMappings = (raw: string): Segment[][] => {
  const result: Segment[][] = [];
  let srcIdx = 0;
  let origLine = 0;
  let origCol = 0;

  for (const line of raw.split(";")) {
    const segments: Segment[] = [];
    let genCol = 0;

    if (line) {
      const pos = { i: 0 };
      while (pos.i < line.length) {
        if (line.charCodeAt(pos.i) === 44) {
          pos.i++;
          continue;
        }
        genCol += decodeVLQ(line, pos);
        if (pos.i >= line.length || line.charCodeAt(pos.i) === 44) continue;
        srcIdx += decodeVLQ(line, pos);
        origLine += decodeVLQ(line, pos);
        origCol += decodeVLQ(line, pos);
        if (pos.i < line.length && line.charCodeAt(pos.i) !== 44) decodeVLQ(line, pos);
        segments.push([genCol, srcIdx, origLine, origCol]);
      }
    }
    result.push(segments);
  }

  return result;
};

const DATA_URI_RE = /^data:application\/json[^,]*;base64,([A-Za-z0-9+/=]+)$/;

const isSameOrigin = (a: string, b: string): boolean => {
  try {
    return new URL(a).origin === new URL(b).origin;
  } catch {
    return false;
  }
};

const fetchAndParse = async (url: string): Promise<SourceMapData | null> => {
  try {
    const res = await fetch(url);
    const text = await res.text();

    const match = text.match(/\/\/[#@]\s*sourceMappingURL=([^\s]+)$/m);
    if (!match) return null;

    const ref = match[1].trim();
    let mapJson: string;

    if (ref.startsWith("data:")) {
      const dataMatch = DATA_URI_RE.exec(ref);
      if (!dataMatch) return null;
      mapJson = atob(dataMatch[1]);
    } else {
      const mapUrl = new URL(ref, url).href;
      if (!isSameOrigin(url, mapUrl)) return null;
      const mapRes = await fetch(mapUrl);
      mapJson = await mapRes.text();
    }

    const raw = JSON.parse(mapJson);
    return { sources: raw.sources, mappings: decodeMappings(raw.mappings) };
  } catch {
    return null;
  }
};

const getSourceMap = (url: string): Promise<SourceMapData | null> => {
  let promise = cache.get(url);
  if (!promise) {
    promise = fetchAndParse(url);
    cache.set(url, promise);
  }
  return promise;
};

const lookup = (map: SourceMapData, genLine: number, genCol: number): Segment | null => {
  if (genLine < 0 || genLine >= map.mappings.length) return null;
  const segments = map.mappings[genLine];
  if (!segments.length) return null;

  let lo = 0;
  let hi = segments.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (segments[mid][0] <= genCol) lo = mid;
    else hi = mid - 1;
  }

  return segments[lo];
};

export const resolveOriginalPosition = async (
  url: string,
  line: number,
  column: number,
): Promise<DebugSource | null> => {
  const map = await getSourceMap(url);
  if (!map) return null;

  const seg = lookup(map, line - 1, column - 1);
  if (!seg) return null;

  const fileName = map.sources[seg[1]];

  return {
    fileName,
    lineNumber: seg[2] + 1,
    columnNumber: seg[3] + 1,
  };
};
