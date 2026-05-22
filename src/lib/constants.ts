import type { State } from "./state/state";

export const DEBUG = (() => {
  if (typeof window === "undefined") {
    return false;
  }
  return new URLSearchParams(window.location.search).has("debug");
})();

export const ESM_SH_URL = "https://esm.sh";
export const NPM_REGISTRY_URL = "https://registry.npmjs.org";

export const KYSELY_PACKAGE_NAME = "kysely";
/** GitHub repository the kysely git branches are built from. */
export const KYSELY_GITHUB_REPO = "kysely-org/kysely";
/**
 * kysely git branches offered as versions alongside published npm releases.
 * Order is the dropdown order — `next` is typically further ahead of the
 * latest release than `master`, so it leads.
 */
export const KYSELY_BRANCH_VERSIONS = ["next", "master"] as const;
/** Always keep at least this many of the most recent kysely versions. */
export const KYSELY_MIN_VERSIONS = 10;
/** Drop kysely versions published longer ago than this (unless kept by the minimum). */
export const KYSELY_MAX_VERSION_AGE_YEARS = 2;

export const CSS_MIN_WIDE_WIDTH = 650;
export const CSS_MIN_DESKTOP_WIDTH = 500;

export const LOCALSTORAGE_THEME = "theme";
export const LOCALSTORAGE_SETTINGS = "settings:";

export const LEGACY_PLAYGROUND_URL = "https://old.kyse.link";

export const QUERY_EDITOR_HEADER_DELIMITER = "\n/* __QUERY_EDITOR_HEADER_DELIMITER__ */\n";

export const SETTING_KEYS = [
  "ts-format:semi",
  "ts-format:single-quote",
  "ts-format:wider-width",
  "sql-format:inline-parameters",
  "sql-format:upper-keywords",
  "save:format-before-save",
  "save:copy-url-after-save",
  "save:save-view-state",
  "editor:indent-guide",
  "editor:lower-debounce-time",
] as const;

export const SETTING_DEFAULTS: Record<(typeof SETTING_KEYS)[number], boolean> = {
  "ts-format:semi": true,
  "ts-format:single-quote": false,
  "ts-format:wider-width": false,
  "sql-format:inline-parameters": false,
  "sql-format:upper-keywords": true,
  "save:format-before-save": true,
  "save:copy-url-after-save": true,
  "save:save-view-state": true,
  "editor:indent-guide": true,
  "editor:lower-debounce-time": false,
};

export const DEBOUNCE_TIME = 400;
export const DEBOUNCE_TIME_LOWER = 150;

export const DEFUALT_STATE: State = {
  dialect: "postgres",
  editors: {
    type: `import {
  Generated,
  Selectable,
  Updateable,
  Insertable,
} from "kysely";

export interface Database {
  person: PersonTable;
  pet: PetTable;
}

export interface PersonTable {
  id: Generated<number>;
  first_name: string;
  last_name: string | null;
  gender: Gender;
}

export interface PetTable {
  id: Generated<number>;
  name: string;
  owner_id: number;
  species: Species;
}

export type Gender = "male" | "female" | "other";
export type Species = "dog" | "cat" | "hamster";

export type Person = Selectable<PersonTable>;
export type NewPerson = Insertable<PersonTable>;
export type PersonUpdate = Updateable<PersonTable>;

export type Pet = Selectable<PetTable>;
export type NewPet = Insertable<PetTable>;
export type PetUpdate = Updateable<PetTable>;

`.trim(),
    query: `
import { sql } from "kysely";
import { Species } from "type-editor";

const species: Species = "hamster";

const rows = await db
  .selectFrom("person")
  .innerJoin("pet", "owner_id", "person.id")
  .where("first_name", "=", sql.lit("Jennifer"))
  .where("species", "=", species)
  .select(["first_name", "pet.name as pet_name"])
  .execute();

`.trim(),
  },
};
