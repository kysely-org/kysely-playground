/**
 * One-time migration of the legacy firestore `states` collection (the backend
 * of pre-fork kyse.link short links) into the worker's kv namespace.
 *
 * The collection is publicly readable, so this needs no credentials:
 *
 *   node scripts/migrate-firestore.mjs
 *   wrangler kv bulk put kv-bulk.json --binding STATES --remote
 */
import { writeFileSync } from "node:fs";

const COLLECTION_URL =
  "https://firestore.googleapis.com/v1/projects/kysely-playground/databases/(default)/documents/states";
const OUT_FILE = "kv-bulk.json";

const entries = [];
const skipped = [];
let pageToken;

do {
  const url = new URL(COLLECTION_URL);
  url.searchParams.set("pageSize", "300");
  if (pageToken) {
    url.searchParams.set("pageToken", pageToken);
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`firestore responded with ${response.status}`);
  }
  const { documents = [], nextPageToken } = await response.json();
  for (const document of documents) {
    const id = decodeURIComponent(document.name.split("/").pop());
    const data = document.fields?.data?.stringValue;
    if (!data) {
      skipped.push(id);
      continue;
    }
    entries.push({
      key: id,
      value: data,
      metadata: {
        createdAt: document.fields?.createdAt?.timestampValue ?? document.createTime,
        migratedFrom: "firestore",
      },
    });
  }
  pageToken = nextPageToken;
  console.log(`fetched ${entries.length} states so far...`);
} while (pageToken);

writeFileSync(OUT_FILE, JSON.stringify(entries, null, 2));
console.log(`wrote ${entries.length} states to ${OUT_FILE}`);
if (skipped.length > 0) {
  console.warn(`skipped ${skipped.length} documents without data:`, skipped);
}
