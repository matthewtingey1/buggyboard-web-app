import type { APIRequestContext } from '@playwright/test';

export const PREFIX = '[functional]';
export const USER = { username: 'buggy', password: process.env.BUGGY_PW ?? '' };

export interface ApiBug { id: number; title: string; severity: string; owner: string; description: string; state: string }

export function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export class BugApi {
  private created: number[] = [];
  constructor(private readonly request: APIRequestContext) {}

  async create(title: string, severity = 'mid', extra: Partial<ApiBug> = {}): Promise<ApiBug> {
    const res = await this.request.post('/api/bugs', {
      data: { title: `${PREFIX} ${title}`, severity, owner: extra.owner ?? 'buggy', description: extra.description ?? 'functional agent fixture' },
    });
    if (!res.ok()) throw new Error(`create failed ${res.status()}`);
    const bug = (await res.json()) as ApiBug;
    this.created.push(bug.id);
    if (extra.state) await this.update(bug.id, { ...bug, state: extra.state });
    return this.get(bug.id) as Promise<ApiBug>;
  }

  async update(id: number, bug: Partial<ApiBug>) {
    const cur = (await this.get(id))!;
    await this.request.put(`/api/bugs/${id}`, { data: { ...cur, ...bug } });
  }

  async get(id: number): Promise<ApiBug | null> {
    const res = await this.request.get(`/api/bugs/${id}`);
    return res.ok() ? ((await res.json()) as ApiBug) : null;
  }

  async findByTitle(title: string): Promise<ApiBug[]> {
    const res = await this.request.get('/api/bugs');
    const all = (await res.json()) as ApiBug[];
    return all.filter((b) => b.title === title);
  }

  track(id: number) { this.created.push(id); }

  async cleanup() {
    for (const id of this.created) {
      const b = await this.get(id);
      if (b && b.title.startsWith(PREFIX)) await this.request.delete(`/api/bugs/${id}`);
    }
    this.created = [];
  }
}
