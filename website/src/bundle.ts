import type { Plugin, RolldownOutput, rolldown as rolldownType } from "@rolldown/browser";
// HACK: Importing from dist to avoid wasm url issues in the browser
// @ts-expect-error
import { rolldown as rolldownImpl } from "../node_modules/@rolldown/browser/dist/index.browser.mjs";
import type { ImportDefinition } from "./import-definition";
import { httpsPlugin, modulePlugin } from "./resolver";

const rolldown: typeof rolldownType = rolldownImpl;

const encoder = new TextEncoder();

export async function bundle(imports: ImportDefinition[], onWarn?: (warn: string) => void) {
  try {
    const code = createCode(imports);
    const entry = `virtual:entry`;
    const bundle = await rolldown({
      treeshake: true,
      input: entry,
      cwd: "/",
      onLog(level, log, logger) {
        if (level !== "warn") return logger(level, log);
        onWarn?.(String(log));
      },
      plugins: [entryPlugin({ id: entry, code }), modulePlugin, httpsPlugin],
    });
    const [bundled, minified] = await Promise.all([
      bundle.generate({ minify: false }),
      bundle.generate({ minify: true }),
    ]);

    const bundledCode = convertChunksToArrayBuffer(bundled);
    const minifiedCode = convertChunksToArrayBuffer(minified);

    const bundledSize = calculateTotalByteLength(bundledCode);
    const minifiedSize = calculateTotalByteLength(minifiedCode);

    const gzip = await Promise.all(minifiedCode.map(getGzip));
    const gzipSize = calculateTotalByteLength(gzip);

    return {
      code: minified.output
        .filter((o) => o.type === "chunk")
        .map((o) => o.code)
        .join("\n"),
      bundled: bundledSize,
      minified: minifiedSize,
      gzip: gzipSize,
    };
  } catch (e) {
    console.error("Bundling error:", e);
    onWarn?.(String(e));
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

function convertChunksToArrayBuffer({ output }: RolldownOutput): ArrayBuffer[] {
  return output.filter((o) => o.type === "chunk").map((o) => encoder.encode(o.code).buffer);
}

function calculateTotalByteLength(arrays: ArrayBuffer[]): number {
  return arrays.reduce((sum, buf) => sum + buf.byteLength, 0);
}

function getGzip(code: ArrayBuffer): Promise<ArrayBuffer> {
  const cs = new CompressionStream("gzip");
  const stream = new Response(code).body!.pipeThrough(cs);
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
