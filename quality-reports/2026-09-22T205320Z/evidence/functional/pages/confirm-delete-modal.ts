import type { Locator, Page } from '@playwright/test';

export class ConfirmDeleteModal {
  readonly dialog: Locator;
  readonly message: Locator;
  readonly deleteButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Delete bug' });
    this.message = this.dialog.locator('p');
    this.deleteButton = this.dialog.getByRole('button', { name: 'Delete' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }
}
