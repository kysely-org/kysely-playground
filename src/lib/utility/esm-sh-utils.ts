import { ESM_SH_URL } from "../constants";
import { StringUtils } from "./string-utils";

/**
 * URL of an npm package's ESM entrypoint (optionally a subpath export).
 */
export function esmShModuleUrl(name: string, version: string, subpath = ""): string {
  const base = `${ESM_SH_URL}/${name}@${version}`;
  const trimmed = StringUtils.trimPrefix(subpath, "/");
  return trimmed === "" ? base : `${base}/${trimmed}`;
}

/**
 * Splits an esm.sh URL into its package base (everything up to and including
 * `@<version>/`) and the package-relative path. esm.sh resolves git branches
 * to a commit SHA, so the base can't be reconstructed from the requested
 * version — it has to be read back from the resolved URL.
 */
export function splitEsmShUrl(url: string): { base: string; path: string } {
  const match = url.match(/^(https?:\/\/.*@[^/]+\/)(.+)$/);
  if (!match) {
    throw new Error(`unexpected esm.sh url: ${url}`);
  }
  return { base: match[1], path: match[2] };
}

/**
 * Fetches a package's `package.json` from esm.sh and returns its `exports`
 * field (empty when absent).
 */
export async function fetchEsmShExports(
  name: string,
  version: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(esmShModuleUrl(name, version, "package.json"));
  if (!res.ok) {
    throw new Error(`esm.sh error ${res.status} for ${name}@${version}/package.json`);
  }
  const pkg = await res.json();
  return pkg?.exports ?? {};
}
