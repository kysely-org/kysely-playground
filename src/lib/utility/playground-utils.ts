import { QUERY_EDITOR_HEADER_DELIMITER } from "../constants";
import type { KyselyDialect } from "../kysely/kysely-dialects";

export class PlaygroundUtils {
  static getEntrypointUrl() {
    return window.origin + import.meta.env.BASE_URL + "playground.js";
  }

  static makeQueryEditorHeader(dialect: KyselyDialect) {
    const { importPath, adapter, introspector, queryCompiler } = dialect;

    const k = '(await import("kysely"))';
    const d = `(await import(${JSON.stringify(importPath)}))`;
    return (
      `
// prettier-ignore
/**
 * [playground]
 *
 * A \`Kysely\` instance with \`Database\` type from \`type-editor\`.
 */
declare const db: import("kysely").Kysely<import("type-editor").Database>;
// prettier-ignore
/**
 * [playground]
 *
 * An interceptor from kysely-playground.
 */
let $playground: {
  /**
   * [playground]
   *
   * Set the result of \`execute()\`.
   *
   * default:
   *  \`{ rows: [{}] }\`
   */
  result: import("kysely").QueryResult<any>;

  /**
   * [playground]
   *
   *  Log messages to result panel.
   */
  log: (...args: any[]) => any;
} = {} as any
// prettier-ignore
// @ts-ignore
const { db } = (await import("playground")).init(${k}.Kysely,new ${d}.${adapter}(),new ${d}.${introspector}(),new ${d}.${queryCompiler}(),$playground);
// prettier-ignore
export {}
      `.trim() + QUERY_EDITOR_HEADER_DELIMITER
    );
  }

  static trimQueryEditorHeader(v: string) {
    const i = v.indexOf(QUERY_EDITOR_HEADER_DELIMITER);
    return v.substring(i + QUERY_EDITOR_HEADER_DELIMITER.length);
  }
}
