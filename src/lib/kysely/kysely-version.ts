import { KYSELY_BRANCH_VERSIONS, KYSELY_GITHUB_REPO, KYSELY_PACKAGE_NAME } from "../constants";

/** A kysely git branch offered as a version (e.g. `master`, `next`). */
export type KyselyBranch = (typeof KYSELY_BRANCH_VERSIONS)[number];

/** Whether `version` names a git branch rather than a published npm release. */
export function isKyselyBranch(version: string): version is KyselyBranch {
  return (KYSELY_BRANCH_VERSIONS as ReadonlyArray<string>).includes(version);
}

/**
 * esm.sh package path for a kysely version. Published versions resolve to
 * `kysely@x.y.z`; branches are built on demand from the GitHub repo at
 * `pr/<owner>/<repo>/kysely@<branch>`.
 */
export function kyselyEsmShName(version: string): string {
  return isKyselyBranch(version)
    ? `pr/${KYSELY_GITHUB_REPO}/${KYSELY_PACKAGE_NAME}`
    : KYSELY_PACKAGE_NAME;
}
