import type { Locator, Page } from '@playwright/test';

export type Column = 'ID' | 'Severity' | 'Title' | 'Owner';

export class BoardPage {
  readonly page: Page;
  readonly table: Locator;
  readonly headerCells: Locator;
  readonly bodyRows: Locator;
  readonly newBugButton: Locator;
  readonly logoutButton: Locator;
  readonly searchInput: Locator;
  readonly clearSearch: Locator;
  readonly openFilter: Locator;
  readonly closedFilter: Locator;
  readonly noMatches: Locator;
  readonly titleBarLogo: Locator;
  readonly titleBarHeading: Locator;
  readonly header: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.getByRole('table', { name: 'Bugs' });
    this.headerCells = this.table.locator('thead th');
    this.bodyRows = this.table.locator('tbody tr[role="button"]');
    this.header = page.locator('header');
    this.newBugButton = page.getByRole('button', { name: 'New Bug' });
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
    this.searchInput = page.getByLabel('Search bugs by title');
    this.clearSearch = page.getByRole('button', { name: 'Clear search' });
    const group = page.getByRole('group', { name: 'Filter by bug state' });
    this.openFilter = group.getByRole('button', { name: 'Open' });
    this.closedFilter = group.getByRole('button', { name: 'Closed' });
    this.noMatches = this.table.getByText('No bugs matched.');
    this.titleBarLogo = this.header.locator('img[src="/logo_50x50.png"]');
    this.titleBarHeading = this.header.getByRole('heading', { name: 'BuggyBoard' });
  }

  async goto() {
    await this.page.goto('/board');
    await this.waitLoaded();
  }

  async waitLoaded() {
    await this.table.getByText('Loading…').waitFor({ state: 'detached' });
  }

  sortButton(col: Column): Locator {
    return this.headerCells.getByRole('button', { name: new RegExp(`^${col}`) });
  }

  headerCell(col: Column): Locator {
    return this.headerCells.filter({ has: this.sortButton(col) });
  }

  async sortBy(col: Column) { await this.sortButton(col).click(); }

  async indicator(col: Column): Promise<string> {
    return ((await this.sortButton(col).locator('span').textContent()) ?? '').replace(/ /g, '').trim();
  }

  async headerNames(): Promise<string[]> {
    return (await this.headerCells.allTextContents()).map((t) => t.replace(/[↑↓ ]/g, '').trim());
  }

  rowFor(title: string): Locator {
    return this.bodyRows.filter({ has: this.page.locator('td:nth-child(3)', { hasText: new RegExp(`^${escapeRe(title)}$`) }) });
  }

  async openBug(title: string) {
    await this.rowFor(title).click();
  }

  async search(text: string) { await this.searchInput.fill(text); }

  async rows(): Promise<Array<{ id: number; severity: string; title: string; owner: string }>> {
    const cells = await this.bodyRows.evaluateAll((trs) =>
      trs.map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => (td.textContent ?? '').trim())));
    return cells.map(([id, severity, title, owner]) => ({ id: Number(id), severity, title, owner }));
  }

  async rowsContaining(token: string) {
    return (await this.rows()).filter((r) => r.title.includes(token));
  }

  async logout() { await this.logoutButton.click(); }
}

export function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
