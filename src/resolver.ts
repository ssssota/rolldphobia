import type { Plugin } from "@rolldown/browser";
import * as r from "resolve.exports";

const cache = createLRUCache<string, Promise<string | void>>(50);
const get = (url: string) => {
  const cached = cache.get(url);
  if (cached) {
    console.log("Cache hit:", url);
    return cached;
  }
  const res = fetch(url).then((r) => r.text());
  cache.set(url, res);
  return res;
};

export const modulePlugin = npmModulePlugin();
export const httpsPlugin = httpsModulePlugin();

function npmModulePlugin(): Plugin {
  return {
    name: "npm-module",
    async resolveId(id: string, importer?: string) {
      console.log("Resolving:", { id, importer });
      if (isHttpProtocol(id)) return id;
      if (importer && isHttpProtocol(importer)) {
        if (id.startsWith(".") || id.startsWith("/")) {
          const url = new URL(id, importer);
          url.search = "raw";
          return url.toString();
        }
        if (isJsrModuleUrl(importer)) {
          if (id.startsWith("@jsr/")) {
            id = id.replace(/^@jsr\//, "jsr:@").replace(/__/, "/");
          }
        }
      }
      if (id.startsWith("jsr:")) {
        const [, moduleName, modulePath] = parseJsrModuleId(id);
        const moduleMeta = await resolveJsrModuleMeta(moduleName);
        if (!moduleMeta) return;
        const resolvedPath = r.exports(moduleMeta, modulePath, { browser: true })?.[0];
        if (!resolvedPath) return;
        const url = new URL(resolvedPath, `https://esm.sh/jsr/${moduleName}/`);
        return url.toString();
      }
      if (id.startsWith("npm:")) {
        id = id.replace(/^npm:/, "");
      }
      const [, moduleName, modulePath] = parseNpmModuleId(id);
      const moduleMeta = await resolveNpmModuleMeta(moduleName);
      if (!moduleMeta) return;
      const resolvedPath = r.exports(moduleMeta, modulePath, { browser: true })?.[0];
      if (!resolvedPath) return;
      const url = new URL(resolvedPath, `https://esm.sh/${moduleName}/`);
      return url.toString();
    },
  };
}

function httpsModulePlugin(): Plugin {
  return {
    name: "https-module",
    load: {
      filter: {
        id: /^https:\/\//,
      },
      async handler(id) {
        const url = new URL(id);
        if (url.origin === "https://esm.sh") url.search = "raw";
        return await get(url.toString());
      },
    },
  };
}

function isHttpProtocol(id: string): boolean {
  return id.startsWith("https://");
}

type JsrModuleId = [kind: "jsr", name: string, path: string];
type NpmModuleId = [kind: "npm", name: string, path: string];
function parseJsrModuleId(id: string): JsrModuleId {
  const [org, name, ...rest] = id.replace(/^jsr:/, "").split("/");
  const moduleName = `${org}/${name}`;
  const modulePath = getRelative(rest);
  return ["jsr", moduleName, modulePath];
}

function parseNpmModuleId(id: string): NpmModuleId {
  const [first, second, ...rest] = id.split("/");
  if (first.startsWith("@")) {
    const moduleName = `${first}/${second}`;
    const modulePath = getRelative(rest);
    return ["npm", moduleName, modulePath];
  }
  const moduleName = first;
  const modulePath = getRelative([second, ...rest]);
  return ["npm", moduleName, modulePath];
}

function getRelative(fragments: string[]): string {
  const path = fragments.join("/");
  if (path === "") return ".";
  return path;
}

async function resolveJsrModuleMeta(moduleName: string): Promise<r.Package | undefined> {
  const fileCandidates = ["jsr.json", "deno.json", "deno.jsonc"];
  const fileBaseUrl = `https://esm.sh/jsr/${moduleName}/`;
  for (const fileName of fileCandidates) {
    const fileUrl = `${fileBaseUrl}${fileName}`;
    const content = await get(fileUrl);
    if (content) {
      try {
        if (fileName.endsWith(".jsonc")) {
          const { parse } = await import("jsonc-parser");
          return parse(content);
        }
        return JSON.parse(content);
      } catch {
        // noop
      }
    }
  }
}
async function resolveNpmModuleMeta(moduleName: string): Promise<r.Package | undefined> {
  const packageJsonUrl = `https://esm.sh/${moduleName}/package.json`;
  const content = await get(packageJsonUrl);
  if (content) {
    try {
      return JSON.parse(content);
    } catch {
      // noop
    }
  }
}

function isJsrModuleUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.origin === "https://esm.sh" && u.pathname.startsWith("/jsr/");
  } catch {
    return false;
  }
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
