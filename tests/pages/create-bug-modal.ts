import type { Locator, Page } from '@playwright/test';

export interface BugFields {
  title?: string;
  severity?: 'HIGH' | 'MID' | 'LOW';
  owner?: string;
  description?: string;
}

export class CreateBugModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly titleInput: Locator;
  readonly severitySelect: Locator;
  readonly ownerInput: Locator;
  readonly descriptionInput: Locator;
  readonly stateSelect: Locator;
  readonly saveButton: Locator;
  readonly savingButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;
  readonly errors: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog', { name: 'Create bug' });
    this.titleInput = this.dialog.getByLabel('Title');
    this.severitySelect = this.dialog.getByLabel('Severity');
    this.ownerInput = this.dialog.getByLabel('Owner');
    this.descriptionInput = this.dialog.getByLabel('Description');
    this.stateSelect = this.dialog.getByLabel('State');
    this.saveButton = this.dialog.getByRole('button', { name: 'Save' });
    this.savingButton = this.dialog.getByRole('button', { name: 'Saving…' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' });
    this.errors = this.dialog.getByRole('alert');
  }

  async fill(fields: BugFields) {
    if (fields.title !== undefined) await this.titleInput.fill(fields.title);
    if (fields.severity !== undefined) await this.severitySelect.selectOption({ label: fields.severity });
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

  async pressEscape() {
    await this.page.keyboard.press('Escape');
  }

  async pressEscapeInSeverity() {
    await this.severitySelect.press('Escape');
  }

  async pressEnterIn(field: 'title' | 'owner') {
    await (field === 'title' ? this.titleInput : this.ownerInput).press('Enter');
  }

  // Two submits in the same task, faster than a user can click, to probe the missing in-flight guard.
  async submitTwiceSynchronously() {
    await this.dialog.locator('form').evaluate((form: HTMLFormElement) => {
      form.requestSubmit();
      form.requestSubmit();
    });
  }

  async pressTab(times: number) {
    for (let i = 0; i < times; i++) await this.page.keyboard.press('Tab');
  }

  async focusIsInside(): Promise<boolean> {
    return this.dialog.evaluate((el) => el.contains(document.activeElement));
  }

  async clickBackdrop() {
    await this.dialog.click({ position: { x: 5, y: 5 } });
  }

  async severityOptionValues(): Promise<string[]> {
    return this.severitySelect.locator('option').evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));
  }
}
