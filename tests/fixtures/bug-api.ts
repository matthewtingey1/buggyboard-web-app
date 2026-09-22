import type { APIRequestContext, APIResponse } from '@playwright/test';

// Tests share one database, so every bug they create carries this prefix and is deleted afterwards.
export const PREFIX = '[e2e]';

export type Severity = 'high' | 'mid' | 'low';
export type State = 'open' | 'closed';

export interface Bug {
  id: number;
  title: string;
  severity: string;
  owner: string;
  description: string;
  state: string;
}

export function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export class BugApi {
  // Ids this test created, and titles of bugs it is about to create through the UI.
  // Both are deleted in cleanup, so a failing test still leaves nothing behind.
  private created = new Set<number>();
  private pendingTitles = new Set<string>();

  constructor(private readonly request: APIRequestContext) {}

  async create(
    title: string,
    options: { severity?: Severity; owner?: string; description?: string; state?: State } = {},
  ): Promise<Bug> {
    const res = await this.request.post('/api/bugs', {
      data: {
        title: `${PREFIX} ${title}`,
        severity: options.severity ?? 'mid',
        owner: options.owner ?? 'buggy',
        description: options.description ?? 'created by the e2e suite',
      },
    });
    if (!res.ok()) throw new Error(`POST /api/bugs failed: ${res.status()}`);
    const bug = (await res.json()) as Bug;
    this.created.add(bug.id);
    if (options.state) await this.update(bug.id, { state: options.state });
    return (await this.get(bug.id)) as Bug;
  }

  async get(id: number): Promise<Bug | null> {
    const res = await this.request.get(`/api/bugs/${id}`);
    return res.ok() ? ((await res.json()) as Bug) : null;
  }

  async update(id: number, changes: Partial<Bug>) {
    const current = await this.get(id);
    await this.request.put(`/api/bugs/${id}`, { data: { ...current, ...changes } });
  }

  async findByTitle(title: string): Promise<Bug[]> {
    return (await this.findAll()).filter((b) => b.title === title);
  }

  async findContaining(token: string): Promise<Bug[]> {
    return (await this.findAll()).filter((b) => b.title.includes(token) || b.description.includes(token));
  }

  async createRaw(data: Record<string, unknown>) {
    const res = await this.request.post('/api/bugs', { data });
    await this.trackResponse(res);
    return res;
  }

  // For contract tests that need exact control over method, path, headers and body.
  async send(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options: { data?: unknown; body?: string; headers?: Record<string, string> } = {},
  ): Promise<APIResponse> {
    const res = await this.request.fetch(path, {
      method,
      data: options.body ?? options.data,
      headers: options.headers,
    });
    if (method === 'POST' && path === '/api/bugs') await this.trackResponse(res);
    return res;
  }

  // Call before creating a bug through the UI, so cleanup finds it even if the test fails before reading it back.
  expectTitle(title: string) {
    this.pendingTitles.add(title);
  }

  track(id: number) {
    this.created.add(id);
  }

  async cleanup() {
    if (this.pendingTitles.size) {
      for (const bug of await this.findAll()) if (this.pendingTitles.has(bug.title)) this.created.add(bug.id);
    }
    for (const id of this.created) await this.request.delete(`/api/bugs/${id}`);
    this.created.clear();
    this.pendingTitles.clear();
  }

  private async findAll(): Promise<Bug[]> {
    return (await this.request.get('/api/bugs')).json() as Promise<Bug[]>;
  }

  private async trackResponse(res: APIResponse) {
    if (res.status() !== 201) return;
    const body = await res.json().catch(() => null);
    if (typeof body?.id === 'number') this.created.add(body.id);
  }
}
