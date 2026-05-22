import { expect, test } from "vitest";
import { esmShModuleUrl, splitEsmShUrl } from "./esm-sh-utils";

test("esmShModuleUrl: builds package and subpath urls", () => {
  expect(esmShModuleUrl("kysely", "0.27.4")).toBe("https://esm.sh/kysely@0.27.4");
  expect(esmShModuleUrl("kysely", "0.27.4", "helpers/postgres")).toBe(
    "https://esm.sh/kysely@0.27.4/helpers/postgres",
  );
  expect(esmShModuleUrl("kysely", "0.27.4", "/helpers/postgres")).toBe(
    "https://esm.sh/kysely@0.27.4/helpers/postgres",
  );
  expect(esmShModuleUrl("pr/kysely-org/kysely/kysely", "master")).toBe(
    "https://esm.sh/pr/kysely-org/kysely/kysely@master",
  );
});

test("splitEsmShUrl: splits a published version url", () => {
  expect(splitEsmShUrl("https://esm.sh/kysely@0.27.4/dist/index.d.ts")).toEqual({
    base: "https://esm.sh/kysely@0.27.4/",
    path: "dist/index.d.ts",
  });
});

test("splitEsmShUrl: splits a branch url resolved to a commit sha", () => {
  expect(
    splitEsmShUrl("https://esm.sh/pr/kysely-org/kysely/kysely@198e9b3/dist/helpers/postgres.d.ts"),
  ).toEqual({
    base: "https://esm.sh/pr/kysely-org/kysely/kysely@198e9b3/",
    path: "dist/helpers/postgres.d.ts",
  });
});

test("splitEsmShUrl: throws on an unexpected url shape", () => {
  expect(() => splitEsmShUrl("https://esm.sh/no-at-sign/index.d.ts")).toThrow();
});
