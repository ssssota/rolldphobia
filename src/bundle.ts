import type { build as buildType, Plugin } from "@rolldown/browser";
import * as path from "@std/path";
// HACK: Importing from dist to avoid wasm url issues in the browser
// @ts-expect-error
import { build as buildImpl } from "../node_modules/@rolldown/browser/dist/index.browser.mjs";
import type { ImportDefinition } from "./types";
const build: typeof buildType = buildImpl;
const encoder = new TextEncoder();
const cache = createLRUCache<string, string>(50);
const get = async (url: string) => {
  const cached = cache.get(url);
  if (cached) return cached;
  try {
    const res = await fetch(url);
    const text = await res.text();
    cache.set(url, text);
    return text;
  } catch {
    // noop
  }
};

const modulePlugin = npmModulePlugin();

export async function bundle(
  imports: ImportDefinition[],
  onWarn?: (warn: string) => void
) {
  try {
    const code = createCode(imports);
    const entry = `virtual:entry`;
    const result = await build({
      treeshake: true,
      input: entry,
      write: false,
      cwd: "/",
      onLog(level, log, logger) {
        if (level !== "warn") return logger(level, log);
        onWarn?.(String(log));
      },
      output: { minify: true },
      plugins: [entryPlugin({ id: entry, code }), modulePlugin],
    });
    const chunks = result.output.filter((c) => c.type === "chunk");
    return await Promise.all(
      chunks.map((c) => {
        const utf8 = encoder.encode(c.code);
        return getGzip(utf8).then((gzipBuffer) => ({
          code: c.code,
          size: utf8.byteLength,
          gzip: gzipBuffer.byteLength,
        }));
      })
    );
  } catch (e) {
    console.error("Bundling error:", e);
    onWarn?.(String(e));
    return [];
  }
}

function entryPlugin(opts: { id: string; code: string }): Plugin {
  const resolvedId = resolved(opts.id);
  const idRegex = new RegExp(`^${opts.id.replace(".", "\\.")}$`);
  const resolvedIdRegex = new RegExp(`^${resolvedId.replace(".", "\\.")}$`);
  return {
    name: "entry",
    resolveId: {
      filter: { id: idRegex },
      handler() {
        return resolvedId;
      },
    },
    load: {
      filter: { id: resolvedIdRegex },
      handler() {
        return opts.code;
      },
    },
  };
}

function npmModulePlugin(): Plugin {
  return {
    name: "npm-module",
    resolveId(id, importer) {
      console.log("Resolving ID:", { id, importer });
      if (isHttpProtocol(id)) {
        return resolved(id);
      }
      importer = importer ? unresolved(importer) : undefined;
      if (importer && isHttpProtocol(importer)) {
        const url = new URL(importer);
        const resolvedPath = id.startsWith("/")
          ? id
          : path.join(path.dirname(url.pathname), id);
        return resolved(`${url.origin}${resolvedPath}`);
      }
      if (id.startsWith("npm:")) {
        id = id.replace(/^npm:/, "");
      } else if (id.startsWith("jsr:")) {
        id = id.replace(/^jsr:/, "jsr/");
      }
      return resolved(`https://esm.sh/${id}`);
    },
    async load(resolvedId) {
      const id = unresolved(resolvedId);
      const cached = cache.get(id);
      if (cached) return cached;

      if (isHttpProtocol(id)) {
        const url = setConditions(id, ["browser", "import", "default"]);
        const code = await get(url);
        if (code) cache.set(id, code);
        return code;
      }
      return null;
    },
  };
}

function isHttpProtocol(id: string) {
  return id.startsWith("https://");
}

function resolved(id: string) {
  return `\0${id}`;
}
function unresolved(id: string) {
  // oxlint-disable-next-line no-control-regex
  return id.replace(/^\0/, "");
}

function setConditions(url: string, conditions: string[]) {
  const u = new URL(url);
  if (u.host !== "esm.sh") return url;
  u.searchParams.set("conditions", conditions.join(","));
  return u.toString();
}

function getGzip(code: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer> {
  const cs = new CompressionStream("gzip");
  const stream = new Response(code.buffer).body!.pipeThrough(cs);
  return new Response(stream).arrayBuffer();
}

function createCode(imports: ImportDefinition[]): string {
  return imports
    .filter((imp) => imp.specifier !== "" && imp.names !== "")
    .map((imp) => `export ${handleNames(imp.names)} from "${imp.specifier}";`)
    .join("\n");
}
function handleNames(importNames: string): string {
  const trimmed = importNames.trim();
  // `import * as _ from "lodash";`
  if (trimmed.startsWith("*")) return trimmed;
  // `import {h} from "preact";`
  if (trimmed.startsWith("{")) return trimmed;
  // `import React from "react";`
  if (!trimmed.endsWith("}")) return `{ default as ${trimmed} }`;
  // `import React, {useState} from "react";`
  return `{default as ${trimmed.replace("{", "")}`;
}

function createLRUCache<K, V>(limit: number) {
  const map = new Map<K, V>();
  return {
    get(key: K): V | undefined {
      const value = map.get(key);
      if (value !== undefined) {
        // Refresh the key
        map.delete(key);
        map.set(key, value);
      }
      return value;
    },
    set(key: K, value: V): void {
      if (map.has(key)) {
        map.delete(key);
      } else if (map.size >= limit) {
        // Remove the oldest entry
        const oldestKey = map.keys().next().value;
        if (oldestKey !== undefined) map.delete(oldestKey);
      }
      map.set(key, value);
    },
  };
}
