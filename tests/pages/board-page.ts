import type { Locator, Page } from '@playwright/test';

export type Column = 'ID' | 'Severity' | 'Title' | 'Owner';

export interface BoardRow {
  id: number;
  severity: string;
  title: string;
  owner: string;
}

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error('element is not visible');
  return b;
}

export class BoardPage {
  readonly page: Page;
  readonly header: Locator;
  readonly titleBarLogo: Locator;
  readonly titleBarHeading: Locator;
  readonly searchInput: Locator;
  readonly clearSearchButton: Locator;
  readonly newBugButton: Locator;
  readonly logoutButton: Locator;
  readonly openFilter: Locator;
  readonly closedFilter: Locator;
  readonly bugTable: Locator;
  readonly headerCells: Locator;
  readonly bugRows: Locator;
  readonly noMatchesMessage: Locator;
  readonly loadingMessage: Locator;
  readonly searchTextbox: Locator;
  readonly loadError: Locator;
  readonly noBugsMessage: Locator;
  readonly noticeMessage: Locator;
  readonly statusMessage: Locator;
  readonly tableRowsByRole: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.titleBarLogo = this.header.locator('img[src="/logo_50x50.png"]');
    this.titleBarHeading = this.header.getByRole('heading', { name: 'BuggyBoard' });
    this.searchInput = page.getByLabel('Search bugs by title');
    this.clearSearchButton = this.header.getByRole('button', { name: 'Clear search', exact: true });
    // Scoped to the header and exact: bug rows are exposed as buttons too, so a title containing
    // "New Bug" or "Logout" would otherwise match.
    this.newBugButton = this.header.getByRole('button', { name: 'New Bug', exact: true });
    this.logoutButton = this.header.getByRole('button', { name: 'Logout', exact: true });
    const stateFilter = page.getByRole('group', { name: 'Filter by bug state' });
    this.openFilter = stateFilter.getByRole('button', { name: 'Open' });
    this.closedFilter = stateFilter.getByRole('button', { name: 'Closed' });
    this.bugTable = page.getByRole('table', { name: 'Bugs' });
    this.headerCells = this.bugTable.locator('thead th');
    // Bug rows are the ones with a title button; loading, empty and error rows have none.
    this.bugRows = this.bugTable.locator('tbody tr').filter({ has: page.locator('td button') });
    this.noMatchesMessage = this.bugTable.getByText('No bugs matched.');
    this.loadingMessage = this.bugTable.getByText('Loading…');
    this.loadError = this.bugTable.getByText("Couldn't load bugs.");
    this.noBugsMessage = this.bugTable.getByText('No bugs.', { exact: true });
    this.noticeMessage = page.locator('main p.text-red-700');
    this.statusMessage = page.getByRole('status');
    this.searchTextbox = page.getByRole('textbox', { name: 'Search bugs by title' });
    this.tableRowsByRole = this.bugTable.getByRole('row');
  }

  // Network control for failure-handling tests. Only bug writes are affected; the board still loads.
  async delayBugWrites(ms: number) {
    await this.page.route('**/api/bugs**', async (route) => {
      if (route.request().method() !== 'GET') await new Promise((r) => setTimeout(r, ms));
      await route.fallback();
    });
  }

  async abortBugWrites() {
    await this.page.route('**/api/bugs**', (route) =>
      route.request().method() === 'GET' ? route.fallback() : route.abort('failed'),
    );
  }

  async openBugWithKeyboard(title: string) {
    await this.rowFor(title).getByRole('button').focus();
    await this.page.keyboard.press('Enter');
  }

  async failBugList() {
    await this.page.route('**/api/bugs', (route) =>
      route.request().method() === 'GET' ? route.fulfill({ status: 500, body: '{}' }) : route.fallback(),
    );
  }

  // Holds the GET for one bug so a later click can overtake it.
  async delayBugRead(id: number, ms: number) {
    await this.page.route(`**/api/bugs/${id}`, async (route) => {
      if (route.request().method() === 'GET') await new Promise((r) => setTimeout(r, ms));
      await route.fallback();
    });
  }

  async rowRoleCount(title: string): Promise<number> {
    return this.bugTable.getByRole('row', { name: title }).count();
  }

  // Enter held down on New Bug: the first keydown opens the modal, the repeats land in its form.
  async holdEnterOnNewBug() {
    await this.newBugButton.focus();
    await this.page.keyboard.down('Enter');
    await this.page.keyboard.down('Enter');
    await this.page.keyboard.down('Enter');
    await this.page.keyboard.up('Enter');
  }

  async bugReadFinished(id: number) {
    await this.page.waitForResponse((res) => res.url().endsWith(`/api/bugs/${id}`) && res.request().method() === 'GET');
  }

  async openInNewTab(): Promise<BoardPage> {
    const tab = new BoardPage(await this.page.context().newPage());
    await tab.goto();
    return tab;
  }

  async scriptInjectionFired(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as { __xss?: boolean }).__xss === true);
  }

  async goto() {
    await this.page.goto('/board');
    await this.waitLoaded();
  }

  async visit(path: string) {
    await this.page.goto(path);
  }

  async reload() {
    await this.page.reload();
  }

  async goBack() {
    await this.page.goBack();
    await this.page.waitForLoadState();
  }

  async waitLoaded() {
    await this.bugTable.waitFor();
    await this.loadingMessage.waitFor({ state: 'detached' });
  }

  async logout() {
    await this.logoutButton.click();
  }

  async openNewBug() {
    await this.newBugButton.click();
  }

  async openNewBugWithKeyboard() {
    await this.newBugButton.focus();
    await this.page.keyboard.press('Enter');
  }

  async openBug(title: string) {
    await this.rowFor(title).click();
  }

  async search(text: string) {
    await this.searchInput.fill(text);
  }

  async clearSearch() {
    await this.clearSearchButton.click();
  }

  async showOpen() {
    await this.openFilter.click();
  }

  async showClosed() {
    await this.closedFilter.click();
  }

  async sortBy(column: Column) {
    await this.sortButton(column).click();
  }

  async sortIndicator(column: Column): Promise<string> {
    return ((await this.sortButton(column).locator('span').textContent()) ?? '').replace(/\s/g, '');
  }

  async headerNames(): Promise<string[]> {
    return (await this.headerCells.allTextContents()).map((t) => t.replace(/[↑↓\s]/g, ''));
  }

  async rows(): Promise<BoardRow[]> {
    const cells = await this.bugRows.evaluateAll((trs) =>
      trs.map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => (td.textContent ?? '').trim())),
    );
    return cells.map(([id, severity, title, owner]) => ({ id: Number(id), severity, title, owner }));
  }

  async rowsContaining(token: string): Promise<BoardRow[]> {
    return (await this.rows()).filter((r) => r.title.includes(token));
  }

  async rowCount(title: string): Promise<number> {
    return this.rowFor(title).count();
  }

  async severityBadgeStyle(title: string) {
    return this.rowFor(title)
      .locator('.severity-badge')
      .evaluate((el) => {
        const s = getComputedStyle(el);
        return { color: s.color, background: s.backgroundColor, fontWeight: Number(s.fontWeight) };
      });
  }

  async severityTokens(): Promise<string[]> {
    return this.page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return ['high', 'mid', 'low'].map((level) => s.getPropertyValue(`--color-severity-${level}`).trim());
    });
  }

  async filterBackground(state: 'open' | 'closed'): Promise<string> {
    return (state === 'open' ? this.openFilter : this.closedFilter).evaluate((el) => getComputedStyle(el).backgroundColor);
  }

  async logoBoxRadius(): Promise<string> {
    return this.titleBarLogo.locator('..').evaluate((el) => getComputedStyle(el).borderRadius);
  }

  // Horizontal distance from the logo's right edge to the title's left edge; negative if the title is left of the logo.
  async logoToTitleGap(): Promise<number> {
    const logo = await box(this.titleBarLogo);
    const title = await box(this.titleBarHeading);
    return title.x - (logo.x + logo.width);
  }

  async logoutRightInset(): Promise<number> {
    const header = await box(this.header);
    const logout = await box(this.logoutButton);
    return header.x + header.width - (logout.x + logout.width);
  }

  private sortButton(column: Column): Locator {
    return this.headerCells.getByRole('button', { name: new RegExp(`^${column}`) });
  }

  private rowFor(title: string): Locator {
    const exact = new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
    return this.bugRows.filter({ has: this.page.locator('td:nth-child(3)', { hasText: exact }) });
  }
}
