import { KYSELY_PACKAGE_NAME } from "../constants";
import { esmShFileUrl, esmShModuleUrl } from "../utility/esm-sh-utils";
import { StringUtils } from "../utility/string-utils";
import { getSupportedDialects, resolveKyselyDialect, type KyselyDialect, type SqlDialect } from "./kysely-dialects";

export type Entrypoint = {
  module: string;
  url: string;
};

export type TypeFile = {
  path: string;
  data: string;
};

export class KyselyModule {
  /**
   * @param moduleSpecifiers - Import specifiers for every module the playground
   *   may import at runtime (`kysely` plus each of this version's subpath
   *   exports), discovered from the version's `package.json` `exports` field.
   */
  constructor(
    readonly version: string,
    private readonly moduleSpecifiers: ReadonlyArray<string>,
  ) {}

  getDialects(): Array<SqlDialect> {
    return getSupportedDialects(this.version);
  }

  getDialect(dialect: SqlDialect): KyselyDialect | undefined {
    return resolveKyselyDialect(dialect, this.version);
  }

  /**
   * Import specifier -> esm.sh URL for every module the playground may import
   * at runtime (`kysely` itself plus each of its subpath exports).
   */
  getEntrypoints(): Array<Entrypoint> {
    return this.moduleSpecifiers.map((module) => ({
      module,
      url: esmShModuleUrl(KYSELY_PACKAGE_NAME, this.version, subpathOf(module)),
    }));
  }

  /**
   * Crawls kysely's `.d.ts` graph from esm.sh so Monaco can offer IntelliSense.
   * Paths are returned relative to kysely's dist directory, so e.g. the entry
   * declaration is `index.d.ts` regardless of where kysely keeps its build.
   */
  async loadTypeFiles(): Promise<Array<TypeFile>> {
    const roots = await this.resolveDeclarationRoots();
    if (roots.length === 0) {
      return [];
    }
    const distPrefix = commonDirPrefix(roots);

    const files = new Map<string, string>();
    let frontier = [...new Set(roots)];
    while (frontier.length > 0) {
      const fetched = await Promise.all(
        frontier.map(async (path) => {
          const res = await fetch(esmShFileUrl(KYSELY_PACKAGE_NAME, this.version, path));
          if (!res.ok) {
            throw new Error(`esm.sh error ${res.status} for ${path}`);
          }
          return { path, content: await res.text() };
        }),
      );

      const next = new Set<string>();
      for (const { path, content } of fetched) {
        files.set(path, content);
        for (const specifier of parseRelativeImports(content)) {
          const resolved = resolvePath(path, specifier);
          if (!files.has(resolved)) {
            next.add(resolved);
          }
        }
      }
      frontier = [...next];
    }

    return [...files].map(([path, content]) => ({
      path: StringUtils.trimPrefix(path, distPrefix),
      data: stripDeclarationExtensions(content),
    }));
  }

  /**
   * The dist-relative `.d.ts` entry of `kysely` and each helper, discovered
   * from esm.sh's `X-TypeScript-Types` header (kysely's build layout has
   * changed between versions, so it can't be hardcoded).
   */
  private async resolveDeclarationRoots(): Promise<Array<string>> {
    const base = `${esmShModuleUrl(KYSELY_PACKAGE_NAME, this.version)}/`;
    const roots = await Promise.all(
      this.moduleSpecifiers.map(async (specifier) => {
        const res = await fetch(esmShModuleUrl(KYSELY_PACKAGE_NAME, this.version, subpathOf(specifier)), {
          method: "HEAD",
        });
        const typesUrl = res.headers.get("x-typescript-types");
        return typesUrl?.startsWith(base) ? typesUrl.slice(base.length) : undefined;
      }),
    );
    return roots.filter((it): it is string => it !== undefined);
  }
}

function subpathOf(specifier: string): string {
  if (specifier === KYSELY_PACKAGE_NAME) {
    return "";
  }
  return StringUtils.trimPrefix(specifier, `${KYSELY_PACKAGE_NAME}/`);
}

function parseRelativeImports(content: string): Array<string> {
  const specifiers = new Set<string>();
  const patterns = [
    /\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\/\/\/\s*<reference\s+path\s*=\s*['"]([^'"]+)['"]/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1].startsWith(".")) {
        specifiers.add(match[1]);
      }
    }
  }
  return [...specifiers];
}

function resolvePath(fromPath: string, specifier: string): string {
  const segments = fromPath.split("/").slice(0, -1);
  for (const segment of specifier.split("/")) {
    if (segment === "" || segment === ".") {
      continue;
    }
    if (segment === "..") {
      segments.pop();
    } else {
      segments.push(segment);
    }
  }
  let resolved = segments.join("/");
  if (!resolved.endsWith(".d.ts")) {
    resolved = `${resolved.replace(/\.js$/, "")}.d.ts`;
  }
  return resolved;
}

/** Longest shared directory prefix (incl. trailing slash) of the given file paths. */
function commonDirPrefix(paths: Array<string>): string {
  const dirs = paths.map((path) => path.split("/").slice(0, -1));
  const [first, ...rest] = dirs;
  let length = first.length;
  for (const segments of rest) {
    let i = 0;
    while (i < length && segments[i] === first[i]) {
      i++;
    }
    length = i;
  }
  return length === 0 ? "" : `${first.slice(0, length).join("/")}/`;
}

function stripDeclarationExtensions(content: string): string {
  return content.replace(/(['"])(\.[^'"]*?)\.d\.ts\1/g, "$1$2$1");
}
