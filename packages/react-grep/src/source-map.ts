import type { DebugSource } from "./types";

interface SourceMapData {
  sources: string[];
  mappings: Segment[][];
}

type Segment = [genCol: number, srcIdx: number, origLine: number, origCol: number];

const MAX_CACHE_SIZE = 100;
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
    /* v8 ignore start */
  } catch {
    return false;
  }
  /* v8 ignore stop */
};

const fetchSourceMapJson = async (ref: string, baseUrl: string): Promise<string | null> => {
  if (ref.startsWith("data:")) {
    const dataMatch = DATA_URI_RE.exec(ref);
    return dataMatch ? atob(dataMatch[1]) : null;
  }
  const mapUrl = new URL(ref, baseUrl).href;
  if (!isSameOrigin(baseUrl, mapUrl)) return null;
  const mapRes = await fetch(mapUrl);
  if (!mapRes.ok) return null;
  return mapRes.text();
};

const flattenIndexedMap = (
  sections: {
    offset: { line: number; column: number };
    map: { sources: string[]; mappings: string };
  }[],
): SourceMapData => {
  const allSources: string[] = [];
  const allMappings: Segment[][] = [];

  for (const section of sections) {
    const decoded = decodeMappings(section.map.mappings);
    const lineOff = section.offset.line;
    const colOff = section.offset.column;
    const srcOff = allSources.length;

    while (allMappings.length < lineOff + decoded.length) allMappings.push([]);

    for (let i = 0; i < decoded.length; i++) {
      const target = allMappings[lineOff + i];
      for (const seg of decoded[i]) {
        target.push([i === 0 ? seg[0] + colOff : seg[0], seg[1] + srcOff, seg[2], seg[3]]);
      }
    }
    allSources.push(...section.map.sources);
  }

  for (const line of allMappings) {
    if (line.length > 1) line.sort((a, b) => a[0] - b[0]);
  }

  return { sources: allSources, mappings: allMappings };
};

const parseSourceMap = (json: string): SourceMapData | null => {
  try {
    const raw = JSON.parse(json);
    if (Array.isArray(raw.sections)) return flattenIndexedMap(raw.sections);
    if (!raw.sources || !raw.mappings) return null;
    return { sources: raw.sources, mappings: decodeMappings(raw.mappings) };
  } catch {
    return null;
  }
};

const fetchAndParse = async (url: string): Promise<SourceMapData | null> => {
  try {
    const res = await fetch(url);
    const text = await res.text();

    const match = text.match(/\/\/[#@]\s*sourceMappingURL=([^\s]+)$/m);
    if (match) {
      const json = await fetchSourceMapJson(match[1].trim(), url);
      if (json) {
        const map = parseSourceMap(json);
        if (map) return map;
      }
    }

    const headerRef = res.headers.get("SourceMap") ?? res.headers.get("X-SourceMap");
    if (headerRef) {
      const json = await fetchSourceMapJson(headerRef.trim(), url);
      if (json) {
        const map = parseSourceMap(json);
        if (map) return map;
      }
    }

    const conventionRes = await fetch(`${url}.map`);
    if (conventionRes.ok) {
      const json = await conventionRes.text();
      return parseSourceMap(json);
    }

    return null;
  } catch {
    return null;
  }
};

const ABOUT_SERVER_RE = /^about:\/\/React\/Server\/file:\/\/\//;
const NEXT_DOTDIR_RE = /[/\\](\.next[/\\].+?)(?:\?.*)?$/;

const fetchAndParseServerFile = async (url: string): Promise<SourceMapData | null> => {
  try {
    const filePath = decodeURIComponent(url.replace(ABOUT_SERVER_RE, ""));
    const dotNextMatch = NEXT_DOTDIR_RE.exec(filePath);
    if (!dotNextMatch) return null;

    /* v8 ignore start */
    const origin = typeof location !== "undefined" ? location.origin : "";
    /* v8 ignore stop */
    const mapUrl = `${origin}/__nextjs_source-map?filename=${encodeURIComponent(dotNextMatch[1])}`;
    const res = await fetch(mapUrl);
    if (!res.ok) return null;
    const json = await res.text();
    if (!json) return null;
    return parseSourceMap(json);
  } catch {
    return null;
  }
};

const getSourceMap = (url: string): Promise<SourceMapData | null> => {
  let promise = cache.get(url);
  if (!promise) {
    if (cache.size >= MAX_CACHE_SIZE) {
      const oldest = cache.keys().next().value!;
      cache.delete(oldest);
    }
    promise = ABOUT_SERVER_RE.test(url) ? fetchAndParseServerFile(url) : fetchAndParse(url);
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

  let fileName = map.sources[seg[1]];
  if (fileName.startsWith("file:///")) {
    fileName = decodeURIComponent(new URL(fileName).pathname);
  }

  return {
    fileName,
    lineNumber: seg[2] + 1,
    columnNumber: seg[3] + 1,
  };
};
