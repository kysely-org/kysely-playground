import { prerelease, rcompare } from "semver";
import {
  KYSELY_BRANCH_VERSIONS,
  KYSELY_MAX_VERSION_AGE_YEARS,
  KYSELY_MIN_VERSIONS,
  KYSELY_PACKAGE_NAME,
} from "../constants";
import { fetchEsmShExports } from "../utility/esm-sh-utils";
import { logger } from "../utility/logger";
import { listExportedModules, listNpmVersions, type NpmVersion } from "../utility/npm-registry-utils";
import { KyselyModule } from "./kysely-module";
import { kyselyEsmShName } from "./kysely-version";

/** A kysely git branch offered as a version, with its importable modules. */
type BranchVersion = {
  name: string;
  moduleSpecifiers: Array<string>;
};

export class KyselyManager {
  static async init(): Promise<KyselyManager> {
    const [published, branches] = await Promise.all([
      listNpmVersions(KYSELY_PACKAGE_NAME),
      loadBranchVersions(),
    ]);

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

    return new KyselyManager(versions, branches);
  }

  private constructor(
    private readonly versions: ReadonlyArray<NpmVersion>,
    private readonly branches: ReadonlyArray<BranchVersion>,
  ) {}

  getVersions(): string[] {
    // branches first, so the bleeding-edge options are easy to spot
    return [...this.branches.map((it) => it.name), ...this.versions.map((it) => it.version)];
  }

  getLatestVersion(): string {
    return this.versions[0].version;
  }

  hasVersion(version: string): boolean {
    return (
      this.branches.some((it) => it.name === version) ||
      this.versions.some((it) => it.version === version)
    );
  }

  getModule(version: string): KyselyModule {
    const branch = this.branches.find((it) => it.name === version);
    if (branch) {
      return new KyselyModule(version, branch.moduleSpecifiers);
    }
    const published = this.versions.find((it) => it.version === version);
    if (!published) {
      throw new Error(`kysely ${version} not found`);
    }
    // The set of importable modules is discovered from this version's published
    // `exports`, so new kysely subpath exports work without playground changes.
    return new KyselyModule(version, listExportedModules(KYSELY_PACKAGE_NAME, published.exports));
  }
}

/**
 * Resolves the importable modules of each kysely git branch from the `exports`
 * of its `package.json` (served by esm.sh). A branch that can't be loaded —
 * e.g. it was deleted, or esm.sh is unreachable — is dropped so the playground
 * still works without it.
 */
async function loadBranchVersions(): Promise<Array<BranchVersion>> {
  const branches = await Promise.all(
    KYSELY_BRANCH_VERSIONS.map(async (name): Promise<BranchVersion | undefined> => {
      try {
        const exports = await fetchEsmShExports(kyselyEsmShName(name), name);
        return { name, moduleSpecifiers: listExportedModules(KYSELY_PACKAGE_NAME, exports) };
      } catch (e) {
        logger.error(`failed to load kysely branch '${name}'`, e);
        return undefined;
      }
    }),
  );
  return branches.filter((it): it is BranchVersion => it !== undefined);
}
