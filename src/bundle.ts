import type { build as buildType, Plugin } from "@rolldown/browser";
// HACK: Importing from dist to avoid wasm url issues in the browser
// @ts-expect-error
import { build as buildImpl } from "../node_modules/@rolldown/browser/dist/index.browser.mjs";
import type { ImportDefinition } from "./import-definition";
import { httpsPlugin, modulePlugin } from "./resolver";

const build: typeof buildType = buildImpl;

const encoder = new TextEncoder();

export async function bundle(imports: ImportDefinition[], onWarn?: (warn: string) => void) {
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
      plugins: [entryPlugin({ id: entry, code }), modulePlugin, httpsPlugin],
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
      }),
    );
  } catch (e) {
    console.error("Bundling error:", e);
    onWarn?.(String(e));
    return [];
  }
}

function entryPlugin(opts: { id: string; code: string }): Plugin {
  const resolvedId = `\0${opts.id}`;
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
