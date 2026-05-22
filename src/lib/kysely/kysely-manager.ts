import { prerelease, rcompare } from "semver";
import { KYSELY_MAX_VERSION_AGE_YEARS, KYSELY_MIN_VERSIONS, KYSELY_PACKAGE_NAME } from "../constants";
import { listExportedModules, listNpmVersions, type NpmVersion } from "../utility/npm-registry-utils";
import { KyselyModule } from "./kysely-module";

export class KyselyManager {
  static async init(): Promise<KyselyManager> {
    const published = await listNpmVersions(KYSELY_PACKAGE_NAME);

    // newest first, stable releases only
    const stable = published
      .filter((it) => prerelease(it.version) === null)
      .sort((a, b) => rcompare(a.version, b.version));

    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - KYSELY_MAX_VERSION_AGE_YEARS);
    const cutoffMs = cutoff.getTime();

    // keep everything from the last N years, but never fewer than the latest M
    const versions = stable.filter(
      (it, index) => index < KYSELY_MIN_VERSIONS || it.publishedAt >= cutoffMs,
    );

    return new KyselyManager(versions);
  }

  private constructor(private readonly versions: ReadonlyArray<NpmVersion>) {}

  getVersions(): string[] {
    return this.versions.map((it) => it.version);
  }

  getLatestVersion(): string {
    return this.versions[0].version;
  }

  hasVersion(version: string): boolean {
    return this.versions.some((it) => it.version === version);
  }

  getModule(version: string): KyselyModule {
    const published = this.versions.find((it) => it.version === version);
    if (!published) {
      throw new Error(`kysely ${version} not found`);
    }
    // The set of importable modules is discovered from this version's published
    // `exports`, so new kysely subpath exports work without playground changes.
    return new KyselyModule(version, listExportedModules(KYSELY_PACKAGE_NAME, published.exports));
  }
}
