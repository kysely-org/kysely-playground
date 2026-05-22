import { expect, test } from "vitest";
import { listExportedModules } from "./npm-registry-utils";

test("listExportedModules: discovers subpath exports", () => {
  expect(
    listExportedModules("kysely", {
      ".": { default: "./dist/index.js" },
      "./helpers/postgres": "./dist/helpers/postgres.js",
      "./migration": "./dist/migration/index.js",
      "./readonly": "./dist/readonly/index.js",
    }),
  ).toEqual(["kysely", "kysely/helpers/postgres", "kysely/migration", "kysely/readonly"]);
});

test("listExportedModules: skips blocked subpaths, wildcards and non-module assets", () => {
  expect(
    listExportedModules("kysely", {
      ".": "./dist/index.js",
      "./internal": null,
      "./helpers/*": "./dist/helpers/*.js",
      "./package.json": "./package.json",
    }),
  ).toEqual(["kysely"]);
});

test("listExportedModules: falls back to the root for non-subpath exports", () => {
  expect(listExportedModules("kysely", {})).toEqual(["kysely"]);
  expect(listExportedModules("kysely", { import: "./dist/index.js" })).toEqual(["kysely"]);
  expect(listExportedModules("kysely", "./dist/index.js")).toEqual(["kysely"]);
  expect(listExportedModules("kysely", null)).toEqual(["kysely"]);
  expect(listExportedModules("kysely", undefined)).toEqual(["kysely"]);
});
