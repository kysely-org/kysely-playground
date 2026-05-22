import { prerelease, rcompare } from "semver";
import { KYSELY_MAX_VERSION_AGE_YEARS, KYSELY_MIN_VERSIONS, KYSELY_PACKAGE_NAME } from "../constants";
import { listNpmVersions } from "../utility/npm-registry-utils";
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
    const versions = stable
      .filter((it, index) => index < KYSELY_MIN_VERSIONS || it.publishedAt >= cutoffMs)
      .map((it) => it.version);

    return new KyselyManager(versions);
  }

  private constructor(private readonly versions: ReadonlyArray<string>) {}

  getVersions(): string[] {
    return this.versions.slice();
  }

  getLatestVersion(): string {
    return this.versions[0];
  }

  hasVersion(version: string): boolean {
    return this.versions.includes(version);
  }

  getModule(version: string): KyselyModule {
    return new KyselyModule(version);
  }
}
