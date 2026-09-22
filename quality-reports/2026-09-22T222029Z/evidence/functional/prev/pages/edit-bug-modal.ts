import type { Locator, Page } from '@playwright/test';

export class EditBugModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly heading: Locator;
  readonly id: Locator;
  readonly title: Locator;
  readonly severity: Locator;
  readonly state: Locator;
  readonly owner: Locator;
  readonly description: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly deleteButton: Locator;
  readonly closeX: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog', { name: /^Edit bug #\d+$/ });
    this.heading = this.dialog.getByRole('heading');
    this.id = this.dialog.getByLabel('ID');
    this.title = this.dialog.getByLabel('Title');
    this.severity = this.dialog.getByLabel('Severity');
    this.state = this.dialog.getByLabel('State');
    this.owner = this.dialog.getByLabel('Owner');
    this.description = this.dialog.getByLabel('Description');
    this.saveButton = this.dialog.getByRole('button', { name: 'Save' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.deleteButton = this.dialog.getByRole('button', { name: 'Delete' });
    this.closeX = this.dialog.getByRole('button', { name: 'Close' });
  }

  async clickBackdrop() {
    await this.dialog.click({ position: { x: 5, y: 5 } });
  }
}
