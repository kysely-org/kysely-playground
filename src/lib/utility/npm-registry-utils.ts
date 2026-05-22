import { NPM_REGISTRY_URL } from "../constants";

export type NpmVersion = {
  version: string;
  publishedAt: number;
};

/**
 * Lists every published version of an npm package along with its publish time.
 */
export async function listNpmVersions(name: string): Promise<Array<NpmVersion>> {
  const res = await fetch(`${NPM_REGISTRY_URL}/${encodeURIComponent(name)}`);
  if (!res.ok) {
    throw new Error(`npm registry error: ${res.status}`);
  }
  const packument = await res.json();
  const time: Record<string, string> = packument.time ?? {};
  return Object.keys(packument.versions ?? {})
    .map((version) => ({ version, publishedAt: Date.parse(time[version]) }))
    .filter((it) => !Number.isNaN(it.publishedAt));
}
