export interface Env {
  STATES: KVNamespace;
  ASSETS: Fetcher;
}

/**
 * Playground states are lz-string `compressToEncodedURIComponent` payloads.
 * Realistic states compress to a few KB; the cap only exists so the endpoint
 * cannot be abused as a free blob store.
 */
const MAX_STATE_LENGTH = 32 * 1024;

/** `compressToEncodedURIComponent`'s output alphabet. */
const STATE_PATTERN = /^[A-Za-z0-9+\-$]+$/;

const CREATE_PATH = "/api/state";
// newly generated ids are base62, but ids migrated from the legacy firestore
// backend use a wider alphabet (e.g. "&&nMl") - accept url path-safe chars.
const GET_PATH_PATTERN = /^\/api\/state\/([A-Za-z0-9!$&'()*+,;=._~%-]{1,64})$/;

/** Stored states are immutable, so resolved ones can be cached forever. */
const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

const ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MAX_ID_TRIES = 16;

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === CREATE_PATH) {
      if (request.method !== "POST") {
        return methodNotAllowed("POST");
      }
      return createState(request, env);
    }

    const match = GET_PATH_PATTERN.exec(url.pathname);
    if (match) {
      if (request.method !== "GET") {
        return methodNotAllowed("GET");
      }
      return getState(request, decodeURIComponent(match[1]), env, ctx);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

async function createState(request: Request, env: Env): Promise<Response> {
  const data = await request.text();
  if (data.length === 0 || data.length > MAX_STATE_LENGTH) {
    return jsonError(413, `state must be 1..${MAX_STATE_LENGTH} characters`);
  }
  if (!STATE_PATTERN.test(data)) {
    return jsonError(400, "state must be an lz-string encodedURIComponent payload");
  }

  // KV has no atomic create-if-absent, so a same-millisecond id collision could
  // overwrite - at single-digit daily writes and 62^5+ id space, acceptable.
  for (let tryCount = 1; tryCount <= MAX_ID_TRIES; tryCount += 1) {
    const id = randomId(4 + tryCount);
    if ((await env.STATES.get(id)) !== null) {
      continue;
    }
    await env.STATES.put(id, data, { metadata: { createdAt: new Date().toISOString() } });
    return Response.json({ id }, { status: 201 });
  }
  return jsonError(500, "could not allocate an id");
}

async function getState(request: Request, id: string, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  const data = await env.STATES.get(id);
  if (data === null) {
    return jsonError(404, `no state with id ${id}`);
  }

  const response = new Response(data, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": IMMUTABLE_CACHE_CONTROL,
    },
  });
  ctx.waitUntil(cache.put(request, response.clone()));
  return response;
}

function randomId(size: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes)
    .map((byte) => ID_ALPHABET[byte % ID_ALPHABET.length])
    .join("");
}

function jsonError(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}

function methodNotAllowed(allow: string): Response {
  return new Response(null, { status: 405, headers: { allow } });
}
