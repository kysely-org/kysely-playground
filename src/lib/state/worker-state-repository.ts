/**
 * Stores encoded states in the playground worker's KV-backed api.
 *
 * See `worker/index.ts`.
 */
export class WorkerStateRepository {
  async add(data: string): Promise<string> {
    const response = await fetch("/api/state", { method: "POST", body: data });
    if (!response.ok) {
      throw new WorkerStateRepositoryError(`failed to store state. status=${response.status}`);
    }
    const { id } = (await response.json()) as { id: string };
    return id;
  }

  async get(id: string): Promise<string> {
    const response = await fetch(`/api/state/${encodeURIComponent(id)}`);
    if (!response.ok) {
      throw new WorkerStateRepositoryError(`failed to fetch state. id=${id} status=${response.status}`);
    }
    return response.text();
  }
}

class WorkerStateRepositoryError extends Error {}
