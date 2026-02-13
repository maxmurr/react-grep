import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

const toBase64DataUri = (json: string): string =>
  `data:application/json;charset=utf-8;base64,${btoa(json)}`;

const makeSourceMap = (sources: string[], mappings: string): string =>
  JSON.stringify({ version: 3, sources, mappings });

const jsWithSourceMapComment = (code: string, mapRef: string): string =>
  `${code}\n//# sourceMappingURL=${mapRef}`;

let resolveOriginalPosition: typeof import("../source-map").resolveOriginalPosition;

const createFetchResponse = (
  body: string,
  opts: { ok?: boolean; headers?: Record<string, string> } = {},
): Response => {
  const { ok = true, headers = {} } = opts;
  return {
    ok,
    text: () => Promise.resolve(body),
    headers: new Headers(headers),
  } as Response;
};

describe("source-map", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
    ({ resolveOriginalPosition } = await import("../source-map"));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("VLQ and decodeMappings", () => {
    it("decodes simple AAAA mapping (all zeros)", async () => {
      const map = makeSourceMap(["src/app.ts"], "AAAA");
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).toEqual({ fileName: "src/app.ts", lineNumber: 1, columnNumber: 1 });
    });

    it("decodes negative VLQ deltas", async () => {
      const map = makeSourceMap(["a.ts", "b.ts"], "AACA,GCDA");
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 4);
      expect(result).not.toBeNull();
      expect(result!.fileName).toBe("b.ts");
      expect(result!.lineNumber).toBe(1);
    });

    it("decodes multi-byte VLQ values (large numbers)", async () => {
      const map = makeSourceMap(["src/big.ts"], "gxBAAA");
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 400);
      expect(result).not.toBeNull();
    });

    it("handles truncated VLQ gracefully", async () => {
      const map = JSON.stringify({ version: 3, sources: ["a.ts"], mappings: "g" });
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).toBeNull();
    });

    it("handles multiple segments separated by commas", async () => {
      const map = makeSourceMap(["a.ts"], "AAAA,GACA");
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 4);
      expect(result).not.toBeNull();
      expect(result!.lineNumber).toBe(2);
    });

    it("handles multiple lines separated by semicolons", async () => {
      const map = makeSourceMap(["a.ts"], "AAAA;AACA");
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 2, 1);
      expect(result).toEqual({ fileName: "a.ts", lineNumber: 2, columnNumber: 1 });
    });

    it("handles empty lines in mappings", async () => {
      const map = makeSourceMap(["a.ts"], "AAAA;;AACA");
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 2, 1);
      expect(result).toBeNull();
    });

    it("consumes optional 5th field (name index) without error", async () => {
      const map = makeSourceMap(["a.ts"], "AAAAA");
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).toEqual({ fileName: "a.ts", lineNumber: 1, columnNumber: 1 });
    });
  });

  describe("data URI parsing", () => {
    it("decodes valid base64 data URI", async () => {
      const map = makeSourceMap(["file.ts"], "AAAA");
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).not.toBeNull();
    });

    it("returns null for non-base64 data URI", async () => {
      const js = jsWithSourceMapComment("code", "data:text/plain,notbase64");
      (fetch as Mock)
        .mockResolvedValueOnce(createFetchResponse(js))
        .mockResolvedValueOnce(createFetchResponse("", { ok: false }));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).toBeNull();
    });
  });

  describe("same-origin check", () => {
    it("fetches same-origin source map URLs", async () => {
      const map = makeSourceMap(["a.ts"], "AAAA");
      const js = jsWithSourceMapComment("code", "http://localhost/app.js.map");
      (fetch as Mock)
        .mockResolvedValueOnce(createFetchResponse(js))
        .mockResolvedValueOnce(createFetchResponse(map));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).not.toBeNull();
    });

    it("rejects cross-origin source map URLs", async () => {
      const js = jsWithSourceMapComment("code", "http://evil.com/app.js.map");
      (fetch as Mock)
        .mockResolvedValueOnce(createFetchResponse(js))
        .mockResolvedValueOnce(createFetchResponse("", { ok: false }));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).toBeNull();
    });
  });

  describe("fetchAndParse — sourceMappingURL comment", () => {
    it("finds //# sourceMappingURL comment", async () => {
      const map = makeSourceMap(["a.ts"], "AAAA");
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).not.toBeNull();
    });

    it("finds //@ sourceMappingURL comment (deprecated)", async () => {
      const map = makeSourceMap(["a.ts"], "AAAA");
      const js = `code\n//@ sourceMappingURL=${toBase64DataUri(map)}`;
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).not.toBeNull();
    });

    it("falls through when sourceMappingURL fetch fails", async () => {
      const js = jsWithSourceMapComment("code", "http://localhost/missing.map");
      (fetch as Mock)
        .mockResolvedValueOnce(createFetchResponse(js))
        .mockResolvedValueOnce(createFetchResponse("", { ok: false }))
        .mockResolvedValueOnce(createFetchResponse("", { ok: false }));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).toBeNull();
    });
  });

  describe("fetchAndParse — response headers", () => {
    it("finds SourceMap header", async () => {
      const map = makeSourceMap(["a.ts"], "AAAA");
      const js = createFetchResponse("code", {
        headers: { SourceMap: "http://localhost/app.js.map" },
      });
      (fetch as Mock).mockResolvedValueOnce(js).mockResolvedValueOnce(createFetchResponse(map));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).not.toBeNull();
    });

    it("finds X-SourceMap header", async () => {
      const map = makeSourceMap(["a.ts"], "AAAA");
      const js = createFetchResponse("code", {
        headers: { "X-SourceMap": "http://localhost/app.js.map" },
      });
      (fetch as Mock).mockResolvedValueOnce(js).mockResolvedValueOnce(createFetchResponse(map));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).not.toBeNull();
    });

    it("falls through when header ref returns unparseable map", async () => {
      const js = createFetchResponse("code", {
        headers: { SourceMap: "http://localhost/bad.map" },
      });
      (fetch as Mock)
        .mockResolvedValueOnce(js)
        .mockResolvedValueOnce(createFetchResponse(JSON.stringify({ version: 3 })))
        .mockResolvedValueOnce(createFetchResponse("", { ok: false }));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).toBeNull();
    });

    it("falls through when header ref fetch fails", async () => {
      const js = createFetchResponse("code", {
        headers: { SourceMap: "http://localhost/missing.map" },
      });
      (fetch as Mock)
        .mockResolvedValueOnce(js)
        .mockResolvedValueOnce(createFetchResponse("", { ok: false }))
        .mockResolvedValueOnce(createFetchResponse("", { ok: false }));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).toBeNull();
    });
  });

  describe("fetchAndParse — convention .map fallback", () => {
    it("fetches {url}.map when no comment or header", async () => {
      const map = makeSourceMap(["a.ts"], "AAAA");
      (fetch as Mock)
        .mockResolvedValueOnce(createFetchResponse("plain code"))
        .mockResolvedValueOnce(createFetchResponse(map));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).not.toBeNull();
      expect((fetch as Mock).mock.calls[1][0]).toBe("http://localhost/app.js.map");
    });

    it("returns null when convention .map also fails", async () => {
      (fetch as Mock)
        .mockResolvedValueOnce(createFetchResponse("plain code"))
        .mockResolvedValueOnce(createFetchResponse("", { ok: false }));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).toBeNull();
    });

    it("returns null when convention .map returns invalid JSON", async () => {
      (fetch as Mock)
        .mockResolvedValueOnce(createFetchResponse("plain code"))
        .mockResolvedValueOnce(createFetchResponse("not json"));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).toBeNull();
    });
  });

  describe("fetchAndParse — network errors", () => {
    it("returns null when fetch throws", async () => {
      (fetch as Mock).mockRejectedValueOnce(new Error("network error"));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).toBeNull();
    });
  });

  describe("parseSourceMap", () => {
    it("returns null for JSON without sources or mappings", async () => {
      const js = jsWithSourceMapComment("code", toBase64DataUri(JSON.stringify({ version: 3 })));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).toBeNull();
    });

    it("handles indexed source map with sections", async () => {
      const indexed = JSON.stringify({
        version: 3,
        sections: [
          {
            offset: { line: 0, column: 0 },
            map: { sources: ["a.ts"], mappings: "AAAA" },
          },
        ],
      });
      const js = jsWithSourceMapComment("code", toBase64DataUri(indexed));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result).toEqual({ fileName: "a.ts", lineNumber: 1, columnNumber: 1 });
    });
  });

  describe("flattenIndexedMap", () => {
    it("applies line and column offsets from sections", async () => {
      const indexed = JSON.stringify({
        version: 3,
        sections: [
          {
            offset: { line: 2, column: 5 },
            map: { sources: ["b.ts"], mappings: "AAAA" },
          },
        ],
      });
      const js = jsWithSourceMapComment("code", toBase64DataUri(indexed));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 3, 6);
      expect(result).toEqual({ fileName: "b.ts", lineNumber: 1, columnNumber: 1 });
    });

    it("merges multiple sections with source index offset", async () => {
      const indexed = JSON.stringify({
        version: 3,
        sections: [
          {
            offset: { line: 0, column: 0 },
            map: { sources: ["a.ts"], mappings: "AAAA" },
          },
          {
            offset: { line: 1, column: 0 },
            map: { sources: ["b.ts"], mappings: "AAAA" },
          },
        ],
      });
      const js = jsWithSourceMapComment("code", toBase64DataUri(indexed));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 2, 1);
      expect(result).toEqual({ fileName: "b.ts", lineNumber: 1, columnNumber: 1 });
    });

    it("does not apply column offset for lines after the first in a section", async () => {
      const indexed = JSON.stringify({
        version: 3,
        sections: [
          {
            offset: { line: 0, column: 10 },
            map: { sources: ["a.ts"], mappings: "AAAA;AACA" },
          },
        ],
      });
      const js = jsWithSourceMapComment("code", toBase64DataUri(indexed));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 2, 1);
      expect(result).toEqual({ fileName: "a.ts", lineNumber: 2, columnNumber: 1 });
    });

    it("sorts segments within a line by generated column", async () => {
      const indexed = JSON.stringify({
        version: 3,
        sections: [
          {
            offset: { line: 0, column: 10 },
            map: { sources: ["late.ts"], mappings: "AAAA" },
          },
          {
            offset: { line: 0, column: 0 },
            map: { sources: ["early.ts"], mappings: "AAAA" },
          },
        ],
      });
      const js = jsWithSourceMapComment("code", toBase64DataUri(indexed));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/app.js", 1, 1);
      expect(result!.fileName).toBe("early.ts");
    });
  });

  describe("fetchAndParseServerFile (Next.js)", () => {
    it("fetches source map for about://React/Server/file:/// URLs", async () => {
      vi.stubGlobal("location", { origin: "http://localhost:3000" });
      const map = makeSourceMap(["server.ts"], "AAAA");
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(map));

      const url = "about://React/Server/file:///app/.next/server/chunks/123.js";
      const result = await resolveOriginalPosition(url, 1, 1);

      expect(result).not.toBeNull();
      expect((fetch as Mock).mock.calls[0][0]).toContain("__nextjs_source-map");
    });

    it("returns null when URL has no .next directory", async () => {
      vi.stubGlobal("location", { origin: "http://localhost:3000" });
      const url = "about://React/Server/file:///app/regular/file.js";
      const result = await resolveOriginalPosition(url, 1, 1);
      expect(result).toBeNull();
    });

    it("returns null when Next.js source map fetch fails", async () => {
      vi.stubGlobal("location", { origin: "http://localhost:3000" });
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse("", { ok: false }));

      const url = "about://React/Server/file:///app/.next/server/chunks/123.js";
      const result = await resolveOriginalPosition(url, 1, 1);
      expect(result).toBeNull();
    });

    it("returns null when Next.js source map response is empty", async () => {
      vi.stubGlobal("location", { origin: "http://localhost:3000" });
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(""));

      const url = "about://React/Server/file:///app/.next/server/chunks/123.js";
      const result = await resolveOriginalPosition(url, 1, 1);
      expect(result).toBeNull();
    });

    it("returns null when Next.js fetch throws", async () => {
      vi.stubGlobal("location", { origin: "http://localhost:3000" });
      (fetch as Mock).mockRejectedValueOnce(new Error("network"));

      const url = "about://React/Server/file:///app/.next/server/chunks/123.js";
      const result = await resolveOriginalPosition(url, 1, 1);
      expect(result).toBeNull();
    });
  });

  describe("LRU cache", () => {
    it("returns cached result on second call for same URL", async () => {
      const map = makeSourceMap(["a.ts"], "AAAA");
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      await resolveOriginalPosition("http://localhost/cached.js", 1, 1);
      await resolveOriginalPosition("http://localhost/cached.js", 1, 1);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("evicts oldest entry when cache exceeds 100", async () => {
      vi.resetModules();
      vi.stubGlobal("fetch", vi.fn());
      ({ resolveOriginalPosition } = await import("../source-map"));

      (fetch as Mock).mockResolvedValue(createFetchResponse("", { ok: false }));

      for (let i = 0; i < 101; i++) {
        await resolveOriginalPosition(`http://localhost/file${i}.js`, 1, 1);
      }

      (fetch as Mock).mockClear();
      await resolveOriginalPosition("http://localhost/file0.js", 1, 1);
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe("lookup (binary search)", () => {
    it("returns null for negative genLine", async () => {
      const map = makeSourceMap(["a.ts"], "AAAA");
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/neg.js", 0, 1);
      expect(result).toBeNull();
    });

    it("returns null for genLine beyond mappings length", async () => {
      const map = makeSourceMap(["a.ts"], "AAAA");
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/beyond.js", 100, 1);
      expect(result).toBeNull();
    });

    it("returns null for empty segments on the line", async () => {
      const map = makeSourceMap(["a.ts"], "AAAA;");
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/empty.js", 2, 1);
      expect(result).toBeNull();
    });

    it("finds nearest segment when column is between segments", async () => {
      const map = makeSourceMap(["a.ts"], "AAAA,KACA");
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/between.js", 1, 3);
      expect(result).toEqual({ fileName: "a.ts", lineNumber: 1, columnNumber: 1 });
    });
  });

  describe("resolveOriginalPosition", () => {
    it("returns null when no source map is found", async () => {
      (fetch as Mock)
        .mockResolvedValueOnce(createFetchResponse("no map"))
        .mockResolvedValueOnce(createFetchResponse("", { ok: false }));

      const result = await resolveOriginalPosition("http://localhost/none.js", 1, 1);
      expect(result).toBeNull();
    });

    it("decodes file:/// source paths", async () => {
      const map = makeSourceMap(["file:///Users/dev/app.ts"], "AAAA");
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/file-url.js", 1, 1);
      expect(result!.fileName).toBe("/Users/dev/app.ts");
    });

    it("uses non-file source paths as-is", async () => {
      const map = makeSourceMap(["src/components/Button.tsx"], "AAAA");
      const js = jsWithSourceMapComment("code", toBase64DataUri(map));
      (fetch as Mock).mockResolvedValueOnce(createFetchResponse(js));

      const result = await resolveOriginalPosition("http://localhost/asis.js", 1, 1);
      expect(result!.fileName).toBe("src/components/Button.tsx");
    });
  });
});
