import type { Locator, Page } from '@playwright/test';

export class CreateBugModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly title: Locator;
  readonly severity: Locator;
  readonly owner: Locator;
  readonly description: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly closeX: Locator;
  readonly errors: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog', { name: 'Create bug' });
    this.title = this.dialog.getByLabel('Title');
    this.severity = this.dialog.getByLabel('Severity');
    this.owner = this.dialog.getByLabel('Owner');
    this.description = this.dialog.getByLabel('Description');
    this.saveButton = this.dialog.getByRole('button', { name: 'Save' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.closeX = this.dialog.getByRole('button', { name: 'Close' });
    this.errors = this.dialog.getByRole('alert');
  }

  async fill(data: { title?: string; severity?: string; owner?: string; description?: string }) {
    if (data.title !== undefined) await this.title.fill(data.title);
    if (data.severity !== undefined) await this.severity.selectOption({ label: data.severity });
    if (data.owner !== undefined) await this.owner.fill(data.owner);
    if (data.description !== undefined) await this.description.fill(data.description);
  }

  async clickBackdrop() {
    await this.dialog.click({ position: { x: 5, y: 5 } });
  }
}
