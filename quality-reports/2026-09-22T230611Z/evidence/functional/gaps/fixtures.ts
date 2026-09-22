import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { LoginPage } from '../../../../../tests/pages/login-page';
import { BoardPage } from '../../../../../tests/pages/board-page';
import { CreateBugModal } from '../../../../../tests/pages/create-bug-modal';
import { EditBugModal } from '../../../../../tests/pages/edit-bug-modal';
import { DeleteConfirmModal } from '../../../../../tests/pages/delete-confirm-modal';

export const PREFIX = '[functional]';
const users = JSON.parse(readFileSync(new URL('../../../../../users.json', import.meta.url), 'utf8')) as { username: string; password: string }[];
export const buggy = users.find((u) => u.username === 'buggy')!;
export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export interface Bug { id: number; title: string; severity: string; owner: string; description: string; state: string }

// Shared-DB-safe board page: the shipped page object matches row buttons whose titles contain "Logout"/"New Bug".
class SafeBoardPage extends BoardPage {
  constructor(page: ConstructorParameters<typeof BoardPage>[0]) {
    super(page);
    const self = this as unknown as Record<string, unknown>;
    self.logoutButton = this.header.getByRole('button', { name: 'Logout', exact: true });
    self.newBugButton = this.header.getByRole('button', { name: 'New Bug', exact: true });
  }
}

export class BugApi {
  private created: number[] = [];
  constructor(private readonly request: APIRequestContext) {}
  async create(title: string, o: { severity?: string; owner?: string; description?: string; state?: 'open' | 'closed' } = {}): Promise<Bug> {
    const res = await this.request.post('/api/bugs', {
      data: { title: `${PREFIX} ${title}`, severity: o.severity ?? 'mid', owner: o.owner ?? 'buggy', description: o.description ?? 'functional gap fixture' },
    });
    const bug = (await res.json()) as Bug;
    this.created.push(bug.id);
    if (o.state) await this.request.put(`/api/bugs/${bug.id}`, { data: { ...bug, state: o.state } });
    return (await this.get(bug.id))!;
  }
  async get(id: number): Promise<Bug | null> {
    const res = await this.request.get(`/api/bugs/${id}`);
    return res.ok() ? ((await res.json()) as Bug) : null;
  }
  async remove(id: number) { await this.request.delete(`/api/bugs/${id}`); }
  async findContaining(token: string): Promise<Bug[]> {
    const all = (await (await this.request.get('/api/bugs')).json()) as Bug[];
    const found = all.filter((b) => b.title.includes(token));
    for (const b of found) this.created.push(b.id);
    return found;
  }
  async cleanup() {
    for (const id of this.created) {
      const b = await this.get(id);
      if (b?.title.startsWith(PREFIX)) await this.remove(id);
    }
  }
}

type F = { bugApi: BugApi; loginPage: LoginPage; boardPage: BoardPage; createBugModal: CreateBugModal; editBugModal: EditBugModal; deleteConfirmModal: DeleteConfirmModal };

export const test = base.extend<F>({
  bugApi: async ({ request }, use) => { const api = new BugApi(request); await use(api); await api.cleanup(); },
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  boardPage: async ({ page }, use) => use(new SafeBoardPage(page)),
  createBugModal: async ({ page }, use) => use(new CreateBugModal(page)),
  editBugModal: async ({ page }, use) => use(new EditBugModal(page)),
  deleteConfirmModal: async ({ page }, use) => use(new DeleteConfirmModal(page)),
});
export { expect };
