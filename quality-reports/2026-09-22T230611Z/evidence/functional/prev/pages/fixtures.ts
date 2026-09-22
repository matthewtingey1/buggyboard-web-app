import { test as base, expect } from '@playwright/test';
import { BugApi, USER } from './api';
import { LoginPage } from './login-page';
import { BoardPage } from './board-page';
import { CreateBugModal } from './create-bug-modal';
import { EditBugModal } from './edit-bug-modal';
import { ConfirmDeleteModal } from './confirm-delete-modal';

type Fixtures = {
  api: BugApi;
  loginPage: LoginPage;
  board: BoardPage;
  createModal: CreateBugModal;
  editModal: EditBugModal;
  confirmDelete: ConfirmDeleteModal;
  signedIn: BoardPage;
};

export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => { const api = new BugApi(request); await use(api); await api.cleanup(); },
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  board: async ({ page }, use) => use(new BoardPage(page)),
  createModal: async ({ page }, use) => use(new CreateBugModal(page)),
  editModal: async ({ page }, use) => use(new EditBugModal(page)),
  confirmDelete: async ({ page }, use) => use(new ConfirmDeleteModal(page)),
  signedIn: async ({ loginPage, board }, use) => {
    await loginPage.login(USER.username, USER.password);
    await board.waitLoaded();
    await use(board);
  },
});

export { expect };
