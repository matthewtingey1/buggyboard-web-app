import { test as base, expect } from '@playwright/test';
import usersJson from '../../users.json' with { type: 'json' };
import { BugApi } from './bug-api';
import { LoginPage } from '../pages/login-page';
import { BoardPage } from '../pages/board-page';
import { CreateBugModal } from '../pages/create-bug-modal';
import { EditBugModal } from '../pages/edit-bug-modal';
import { DeleteConfirmModal } from '../pages/delete-confirm-modal';

export { PREFIX, uid } from './bug-api';

export type User = { username: string; password: string };

// Imported rather than hardcoded so a user added to users.json is covered without editing the tests.
export const users: User[] = usersJson;
export const defaultUser = users[0];
// The personal matt account when the local users.json has one; the committed file does not.
export const seedUser = users.find((u) => u.username === 'matt') ?? defaultUser;

export const severityColors = {
  HIGH: 'rgb(184, 74, 46)',
  MID: 'rgb(166, 124, 71)',
  LOW: 'rgb(74, 107, 94)',
} as const;

type Fixtures = {
  bugApi: BugApi;
  loginPage: LoginPage;
  boardPage: BoardPage;
  createBugModal: CreateBugModal;
  editBugModal: EditBugModal;
  deleteConfirmModal: DeleteConfirmModal;
};

export const test = base.extend<Fixtures>({
  bugApi: async ({ request }, use) => {
    const api = new BugApi(request);
    await use(api);
    await api.cleanup();
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  boardPage: async ({ page }, use) => {
    await use(new BoardPage(page));
  },
  createBugModal: async ({ page }, use) => {
    await use(new CreateBugModal(page));
  },
  editBugModal: async ({ page }, use) => {
    await use(new EditBugModal(page));
  },
  deleteConfirmModal: async ({ page }, use) => {
    await use(new DeleteConfirmModal(page));
  },
});

export { expect };
