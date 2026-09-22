import type { Locator, Page } from '@playwright/test';

export class DeleteConfirmModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly message: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog', { name: 'Delete bug' });
    this.message = this.dialog.locator('p');
    this.confirmButton = this.dialog.getByRole('button', { name: 'Delete' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  async confirm() {
    await this.confirmButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async pressEscape() {
    await this.page.keyboard.press('Escape');
  }

  async clickBackdrop() {
    await this.dialog.click({ position: { x: 5, y: 5 } });
  }

  async focusIsInside(): Promise<boolean> {
    return this.dialog.evaluate((el) => el.contains(document.activeElement));
  }
}
