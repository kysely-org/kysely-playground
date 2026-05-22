import type { SqlDialect } from "../kysely/kysely-dialects";

export type State = {
  dialect: SqlDialect;
  editors: {
    type: string;
    query: string;
  };
  hideType?: boolean;
  kysely?: {
    version: string;
  };
};
