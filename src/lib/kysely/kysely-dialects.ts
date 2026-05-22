import { satisfies } from "semver";

export type SqlDialect = "postgres" | "mysql" | "mssql" | "sqlite";

/**
 * How a single SQL dialect maps onto a range of kysely versions.
 *
 * A dialect can have multiple entries — one per version range — so the mapping
 * keeps working if kysely renames a dialect, moves it to a subpath export, etc.
 */
export type KyselyDialect = {
  /** Range of kysely versions this entry applies to (semver range syntax). */
  versionRange: string;
  /** Import specifier for the adapter/introspector/query-compiler classes. */
  importPath: string;
  adapter: string;
  introspector: string;
  queryCompiler: string;
  /** Import specifier for the dialect's query-building helpers. */
  helpersImportPath: string;
};

export const KYSELY_DIALECTS: Record<SqlDialect, Array<KyselyDialect>> = {
  postgres: [
    {
      versionRange: ">=0.24.0",
      importPath: "kysely",
      adapter: "PostgresAdapter",
      introspector: "PostgresIntrospector",
      queryCompiler: "PostgresQueryCompiler",
      helpersImportPath: "kysely/helpers/postgres",
    },
  ],
  mysql: [
    {
      versionRange: ">=0.24.0",
      importPath: "kysely",
      adapter: "MysqlAdapter",
      introspector: "MysqlIntrospector",
      queryCompiler: "MysqlQueryCompiler",
      helpersImportPath: "kysely/helpers/mysql",
    },
  ],
  mssql: [
    {
      versionRange: ">=0.27.0",
      importPath: "kysely",
      adapter: "MssqlAdapter",
      introspector: "MssqlIntrospector",
      queryCompiler: "MssqlQueryCompiler",
      helpersImportPath: "kysely/helpers/mssql",
    },
  ],
  sqlite: [
    {
      versionRange: ">=0.24.0",
      importPath: "kysely",
      adapter: "SqliteAdapter",
      introspector: "SqliteIntrospector",
      queryCompiler: "SqliteQueryCompiler",
      helpersImportPath: "kysely/helpers/sqlite",
    },
  ],
};

/**
 * Resolves the kysely dialect mapping for a given SQL dialect at a given
 * kysely version, or `undefined` when the version doesn't support it.
 */
export function resolveKyselyDialect(dialect: SqlDialect, version: string): KyselyDialect | undefined {
  return KYSELY_DIALECTS[dialect].find((entry) =>
    satisfies(version, entry.versionRange, { includePrerelease: true }),
  );
}

/**
 * Lists the SQL dialects supported by a given kysely version.
 */
export function getSupportedDialects(version: string): Array<SqlDialect> {
  return (Object.keys(KYSELY_DIALECTS) as Array<SqlDialect>).filter(
    (dialect) => resolveKyselyDialect(dialect, version) !== undefined,
  );
}
