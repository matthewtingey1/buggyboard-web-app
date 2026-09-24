import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly logo: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator('img[src="/logo_50x50.png"]');
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.error = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async visit(path: string) {
    await this.page.goto(path);
  }

  async fill(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async submit(username: string, password: string) {
    await this.fill(username, password);
    await this.loginButton.click();
  }

  async pressEnterIn(field: 'username' | 'password') {
    await (field === 'username' ? this.usernameInput : this.passwordInput).press('Enter');
  }

  async login(username: string, password: string) {
    await this.goto();
    await this.submit(username, password);
    await this.page.waitForURL(/\/board$/);
  }

  // Writes the client-side session value directly, as an attacker with devtools could.
  async forgeSession(username: string) {
    await this.page.goto('/login');
    await this.page.evaluate((u) => localStorage.setItem('buggyboard_user', JSON.stringify({ username: u })), username);
  }

  async faviconHref(): Promise<string | null> {
    return this.page.locator('link[rel="icon"]').getAttribute('href');
  }

  // Read through the context so it also works when Back has left the tab on about:blank.
  async storedUser(): Promise<string | null> {
    const { origins } = await this.page.context().storageState();
    const entry = origins.flatMap((o) => o.localStorage).find((e) => e.name === 'buggyboard_user');
    return entry?.value ?? null;
  }
}
