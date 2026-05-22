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
 * URL of a raw file inside an npm package (e.g. a `.d.ts` declaration file).
 */
export function esmShFileUrl(name: string, version: string, path: string): string {
  return `${ESM_SH_URL}/${name}@${version}/${StringUtils.trimPrefix(path, "/")}`;
}
