import type { Locator, Page } from '@playwright/test';
import type { BugFields } from './create-bug-modal';

export class EditBugModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly heading: Locator;
  readonly idInput: Locator;
  readonly titleInput: Locator;
  readonly severitySelect: Locator;
  readonly stateSelect: Locator;
  readonly ownerInput: Locator;
  readonly descriptionInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly deleteButton: Locator;
  readonly closeButton: Locator;
  readonly errors: Locator;
  readonly blankHint: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog', { name: /^Edit bug #\d+$/ });
    this.heading = this.dialog.getByRole('heading');
    this.idInput = this.dialog.getByLabel('ID');
    this.titleInput = this.dialog.getByLabel('Title');
    this.severitySelect = this.dialog.getByLabel('Severity');
    this.stateSelect = this.dialog.getByLabel('State');
    this.ownerInput = this.dialog.getByLabel('Owner');
    this.descriptionInput = this.dialog.getByLabel('Description');
    this.saveButton = this.dialog.getByRole('button', { name: 'Save' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.deleteButton = this.dialog.getByRole('button', { name: 'Delete' });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' });
    this.errors = this.dialog.getByRole('alert');
    this.blankHint = this.dialog.locator('#edit-bug-blank-hint');
  }

  async pressEnterIn(field: 'title' | 'description') {
    await (field === 'title' ? this.titleInput : this.descriptionInput).press('Enter');
  }

  async fill(fields: BugFields & { state?: 'Open' | 'Closed' }) {
    if (fields.title !== undefined) await this.titleInput.fill(fields.title);
    if (fields.severity !== undefined) await this.severitySelect.selectOption({ label: fields.severity });
    if (fields.state !== undefined) await this.stateSelect.selectOption({ label: fields.state });
    if (fields.owner !== undefined) await this.ownerInput.fill(fields.owner);
    if (fields.description !== undefined) await this.descriptionInput.fill(fields.description);
  }

  async save() {
    await this.saveButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async close() {
    await this.closeButton.click();
  }

  async delete() {
    await this.deleteButton.click();
  }

  async pressEscape() {
    await this.page.keyboard.press('Escape');
  }

  async clickBackdrop() {
    await this.dialog.click({ position: { x: 5, y: 5 } });
  }

  async typeIntoId(text: string) {
    // The field is read-only, so typing is expected to be refused; the timeout keeps the attempt short.
    await this.idInput.pressSequentially(text, { timeout: 2000 }).catch(() => undefined);
  }

  async severityOptionValues(): Promise<string[]> {
    return this.severitySelect.locator('option').evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));
  }
}
