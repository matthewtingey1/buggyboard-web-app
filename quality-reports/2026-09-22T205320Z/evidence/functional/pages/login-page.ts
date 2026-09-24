import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly error: Locator;
  readonly logo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.error = page.getByRole('alert');
    this.logo = page.locator('img[src="/logo_50x50.png"]');
  }

  async goto() { await this.page.goto('/login'); }

  async fill(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async submit(username: string, password: string) {
    await this.fill(username, password);
    await this.loginButton.click();
  }

  async login(username: string, password: string) {
    await this.goto();
    await this.submit(username, password);
    await this.page.waitForURL(/\/board$/);
  }

  async storedUser(): Promise<string | null> {
    return this.page.evaluate(() => localStorage.getItem('buggyboard_user'));
  }
}
