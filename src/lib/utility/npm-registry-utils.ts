import { NPM_REGISTRY_URL } from "../constants";

export type NpmVersion = {
  version: string;
  publishedAt: number;
  /** Raw `exports` field of this version's `package.json`, as published. */
  exports: Record<string, unknown>;
};

/**
 * Lists every published version of an npm package along with its publish time
 * and `package.json` `exports` field.
 */
export async function listNpmVersions(name: string): Promise<Array<NpmVersion>> {
  const res = await fetch(`${NPM_REGISTRY_URL}/${encodeURIComponent(name)}`);
  if (!res.ok) {
    throw new Error(`npm registry error: ${res.status}`);
  }
  const packument = await res.json();
  const time: Record<string, string> = packument.time ?? {};
  const versions: Record<string, { exports?: Record<string, unknown> }> = packument.versions ?? {};
  return Object.keys(versions)
    .map((version) => ({
      version,
      publishedAt: Date.parse(time[version]),
      exports: versions[version].exports ?? {},
    }))
    .filter((it) => !Number.isNaN(it.publishedAt));
}

/**
 * Import specifiers a package exposes, derived from its `package.json`
 * `exports` field — e.g. `["kysely", "kysely/migration", "kysely/helpers/postgres"]`.
 *
 * Falls back to just the package root when `exports` is absent, a bare string,
 * or a root-only conditions map (older packages predating subpath exports).
 */
export function listExportedModules(name: string, exports: unknown): Array<string> {
  if (exports === null || typeof exports !== "object") {
    return [name];
  }
  const entries = Object.entries(exports as Record<string, unknown>);
  // An `exports` object is either a subpath map (every key starts with ".") or
  // a bare conditions map describing the root export alone.
  if (!entries.some(([key]) => key.startsWith("."))) {
    return [name];
  }
  const modules = new Set<string>([name]);
  for (const [key, value] of entries) {
    // Skip blocked subpaths (`null`), wildcards (can't be enumerated), and
    // non-module assets exposed via `exports` (e.g. `./package.json`).
    if (!key.startsWith(".") || value === null || key.includes("*") || /\.\w+$/.test(key)) {
      continue;
    }
    modules.add(key === "." ? name : `${name}/${key.slice(2)}`);
  }
  return [...modules];
}