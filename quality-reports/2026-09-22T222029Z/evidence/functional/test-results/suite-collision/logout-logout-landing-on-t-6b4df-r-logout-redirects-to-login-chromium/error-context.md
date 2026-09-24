# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: logout/logout.spec.ts >> landing on the board via Back after logout redirects to login
- Location: tests/logout/logout.spec.ts:33:1

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Logout' }) resolved to 3 elements:
    1) <button type="button" class="rounded-lg px-4 py-2 text-base font-medium text-stone-600 border border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">Logout</button> aka getByRole('button', { name: 'Logout', exact: true })
    2) <tr tabindex="0" role="button" class="border-b border-stone-100 hover:bg-stone-50/80 transition-colors cursor-pointer">…</tr> aka getByRole('button', { name: '3249 MID [exploratory] R03' })
    3) <tr tabindex="0" role="button" class="border-b border-stone-100 hover:bg-stone-50/80 transition-colors cursor-pointer">…</tr> aka getByRole('button', { name: '3309 MID [functional] New Bug' })

Call log:
  - waiting for getByRole('button', { name: 'Logout' })

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - banner [ref=f1e4]:
    - generic [ref=f1e5]:
      - img "BuggyBoard" [ref=f1e7]
      - heading "BuggyBoard" [level=1] [ref=f1e8]
    - generic [ref=f1e9]:
      - search "Search bugs by title" [ref=f1e11]
      - button "New Bug" [ref=f1e13] [cursor=pointer]
      - button "Logout" [ref=f1e15] [cursor=pointer]
  - main [ref=f1e16]:
    - generic [ref=f1e17]:
      - group "Filter by bug state" [ref=f1e19]:
        - button "Open" [ref=f1e20] [cursor=pointer]
        - button "Closed" [ref=f1e21] [cursor=pointer]
      - table "Bugs" [ref=f1e24]:
        - rowgroup [ref=f1e25]:
          - row [ref=f1e26]:
            - columnheader [ref=f1e27]:
              - button "ID" [ref=f1e28] [cursor=pointer]
            - columnheader [ref=f1e30]:
              - button "Severity" [ref=f1e31] [cursor=pointer]:
                - text: Severity
                - generic [aria-hidden] [ref=f1e32]: ↓
            - columnheader [ref=f1e33]:
              - button "Title" [ref=f1e34] [cursor=pointer]
            - columnheader [ref=f1e36]:
              - button "Owner" [ref=f1e37] [cursor=pointer]
        - rowgroup [ref=f1e39]:
          - button [ref=f1e40] [cursor=pointer]:
            - cell "2" [ref=f1e41]
            - cell "HIGH" [ref=f1e42]
            - cell "Bug API endpoints work without logging in" [ref=f1e44]
            - cell "matt" [ref=f1e45]
          - button [ref=f1e46] [cursor=pointer]:
            - cell "3146" [ref=f1e47]
            - cell "HIGH" [ref=f1e48]
            - cell "[exploratory] R01 lost-update mud8rj8t" [ref=f1e50]
            - cell "buggy" [ref=f1e51]
          - button [ref=f1e52] [cursor=pointer]:
            - cell "3149" [ref=f1e53]
            - cell "HIGH" [ref=f1e54]
            - cell "[exploratory] R05 mud8rj8t XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" [ref=f1e56]
            - cell "buggy" [ref=f1e57]
          - button [ref=f1e58] [cursor=pointer]:
            - cell "3151" [ref=f1e59]
            - cell "HIGH" [ref=f1e60]
            - cell "[exploratory] R07 mud8rj8t" [ref=f1e62]
            - cell "nobody-such-user" [ref=f1e63]
          - button [ref=f1e64] [cursor=pointer]:
            - cell "3152" [ref=f1e65]
            - cell "HIGH" [ref=f1e66]
            - cell "[exploratory] R07b mud8rj8t" [ref=f1e68]
            - cell "Buggy" [ref=f1e69]
          - button [ref=f1e70] [cursor=pointer]:
            - cell "3" [ref=f1e71]
            - cell "MID" [ref=f1e72]
            - cell "Search does not match on bug description" [ref=f1e74]
            - cell "matt" [ref=f1e75]
          - button [ref=f1e76] [cursor=pointer]:
            - cell "3249" [ref=f1e77]
            - cell "MID" [ref=f1e78]
            - cell "[exploratory] R03 after-logout mud8sdm7" [ref=f1e80]
            - cell "buggy" [ref=f1e81]
          - button [ref=f1e82] [cursor=pointer]:
            - cell "3254" [ref=f1e83]
            - cell "MID" [ref=f1e84]
            - cell "[exploratory] R06 dup mud8sdm7" [ref=f1e86]
            - cell "buggy" [ref=f1e87]
          - button [ref=f1e88] [cursor=pointer]:
            - cell "3255" [ref=f1e89]
            - cell "MID" [ref=f1e90]
            - cell "[exploratory] R06 dup mud8sdm7" [ref=f1e92]
            - cell "buggy" [ref=f1e93]
          - button [ref=f1e94] [cursor=pointer]:
            - cell "3309" [ref=f1e95]
            - cell "MID" [ref=f1e96]
            - cell "[functional] New Bug Logout collision probe" [ref=f1e98]
            - cell "buggy" [ref=f1e99]
          - button [ref=f1e100] [cursor=pointer]:
            - cell "1" [ref=f1e101]
            - cell "LOW" [ref=f1e102]
            - cell "Login page accepts username with trailing spaces" [ref=f1e104]
            - cell "matt" [ref=f1e105]
          - button [ref=f1e106] [cursor=pointer]:
            - cell "1965" [ref=f1e107]
            - cell "LOW" [ref=f1e108]
            - cell [ref=f1e110]
            - cell "buggy" [ref=f1e111]
          - button [ref=f1e112] [cursor=pointer]:
            - cell "2009" [ref=f1e113]
            - cell "LOW" [ref=f1e114]
            - cell [ref=f1e116]
            - cell "buggy" [ref=f1e117]
          - button [ref=f1e118] [cursor=pointer]:
            - cell "2099" [ref=f1e119]
            - cell "LOW" [ref=f1e120]
            - cell [ref=f1e122]
            - cell "buggy" [ref=f1e123]
          - button [ref=f1e124] [cursor=pointer]:
            - cell "2437" [ref=f1e125]
            - cell "LOW" [ref=f1e126]
            - cell [ref=f1e128]
            - cell "buggy" [ref=f1e129]
          - button [ref=f1e130] [cursor=pointer]:
            - cell "2786" [ref=f1e131]
            - cell "LOW" [ref=f1e132]
            - cell [ref=f1e134]
            - cell "buggy" [ref=f1e135]
          - button [ref=f1e136] [cursor=pointer]:
            - cell "3150" [ref=f1e137]
            - cell "LOW" [ref=f1e138]
            - cell [ref=f1e140]
            - cell "buggy" [ref=f1e141]
          - button [ref=f1e142] [cursor=pointer]:
            - cell "3287" [ref=f1e143]
            - cell "LOW" [ref=f1e144]
            - cell [ref=f1e146]
            - cell "buggy" [ref=f1e147]
```

# Test source

```ts
  1   | import type { Locator, Page } from '@playwright/test';
  2   | 
  3   | export type Column = 'ID' | 'Severity' | 'Title' | 'Owner';
  4   | 
  5   | export interface BoardRow {
  6   |   id: number;
  7   |   severity: string;
  8   |   title: string;
  9   |   owner: string;
  10  | }
  11  | 
  12  | async function box(locator: Locator) {
  13  |   const b = await locator.boundingBox();
  14  |   if (!b) throw new Error('element is not visible');
  15  |   return b;
  16  | }
  17  | 
  18  | export class BoardPage {
  19  |   readonly page: Page;
  20  |   readonly header: Locator;
  21  |   readonly titleBarLogo: Locator;
  22  |   readonly titleBarHeading: Locator;
  23  |   readonly searchInput: Locator;
  24  |   readonly clearSearchButton: Locator;
  25  |   readonly newBugButton: Locator;
  26  |   readonly logoutButton: Locator;
  27  |   readonly openFilter: Locator;
  28  |   readonly closedFilter: Locator;
  29  |   readonly bugTable: Locator;
  30  |   readonly headerCells: Locator;
  31  |   readonly bugRows: Locator;
  32  |   readonly noMatchesMessage: Locator;
  33  |   readonly loadingMessage: Locator;
  34  |   readonly searchTextbox: Locator;
  35  |   readonly tableRowsByRole: Locator;
  36  | 
  37  |   constructor(page: Page) {
  38  |     this.page = page;
  39  |     this.header = page.locator('header');
  40  |     this.titleBarLogo = this.header.locator('img[src="/logo_50x50.png"]');
  41  |     this.titleBarHeading = this.header.getByRole('heading', { name: 'BuggyBoard' });
  42  |     this.searchInput = page.getByLabel('Search bugs by title');
  43  |     this.clearSearchButton = page.getByRole('button', { name: 'Clear search' });
  44  |     this.newBugButton = page.getByRole('button', { name: 'New Bug' });
  45  |     this.logoutButton = page.getByRole('button', { name: 'Logout' });
  46  |     const stateFilter = page.getByRole('group', { name: 'Filter by bug state' });
  47  |     this.openFilter = stateFilter.getByRole('button', { name: 'Open' });
  48  |     this.closedFilter = stateFilter.getByRole('button', { name: 'Closed' });
  49  |     this.bugTable = page.getByRole('table', { name: 'Bugs' });
  50  |     this.headerCells = this.bugTable.locator('thead th');
  51  |     this.bugRows = this.bugTable.locator('tbody tr[role="button"]');
  52  |     this.noMatchesMessage = this.bugTable.getByText('No bugs matched.');
  53  |     this.loadingMessage = this.bugTable.getByText('Loading…');
  54  |     this.searchTextbox = page.getByRole('textbox', { name: 'Search bugs by title' });
  55  |     this.tableRowsByRole = this.bugTable.getByRole('row');
  56  |   }
  57  | 
  58  |   async openBugWithKeyboard(title: string) {
  59  |     await this.rowFor(title).focus();
  60  |     await this.page.keyboard.press('Enter');
  61  |   }
  62  | 
  63  |   async scriptInjectionFired(): Promise<boolean> {
  64  |     return this.page.evaluate(() => (window as unknown as { __xss?: boolean }).__xss === true);
  65  |   }
  66  | 
  67  |   async goto() {
  68  |     await this.page.goto('/board');
  69  |     await this.waitLoaded();
  70  |   }
  71  | 
  72  |   async visit(path: string) {
  73  |     await this.page.goto(path);
  74  |   }
  75  | 
  76  |   async reload() {
  77  |     await this.page.reload();
  78  |   }
  79  | 
  80  |   async goBack() {
  81  |     await this.page.goBack();
  82  |     await this.page.waitForLoadState();
  83  |   }
  84  | 
  85  |   async waitLoaded() {
  86  |     await this.bugTable.waitFor();
  87  |     await this.loadingMessage.waitFor({ state: 'detached' });
  88  |   }
  89  | 
  90  |   async logout() {
> 91  |     await this.logoutButton.click();
      |                             ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Logout' }) resolved to 3 elements:
  92  |   }
  93  | 
  94  |   async openNewBug() {
  95  |     await this.newBugButton.click();
  96  |   }
  97  | 
  98  |   async openBug(title: string) {
  99  |     await this.rowFor(title).click();
  100 |   }
  101 | 
  102 |   async search(text: string) {
  103 |     await this.searchInput.fill(text);
  104 |   }
  105 | 
  106 |   async clearSearch() {
  107 |     await this.clearSearchButton.click();
  108 |   }
  109 | 
  110 |   async showOpen() {
  111 |     await this.openFilter.click();
  112 |   }
  113 | 
  114 |   async showClosed() {
  115 |     await this.closedFilter.click();
  116 |   }
  117 | 
  118 |   async sortBy(column: Column) {
  119 |     await this.sortButton(column).click();
  120 |   }
  121 | 
  122 |   async sortIndicator(column: Column): Promise<string> {
  123 |     return ((await this.sortButton(column).locator('span').textContent()) ?? '').replace(/\s/g, '');
  124 |   }
  125 | 
  126 |   async headerNames(): Promise<string[]> {
  127 |     return (await this.headerCells.allTextContents()).map((t) => t.replace(/[↑↓\s]/g, ''));
  128 |   }
  129 | 
  130 |   async rows(): Promise<BoardRow[]> {
  131 |     const cells = await this.bugRows.evaluateAll((trs) =>
  132 |       trs.map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => (td.textContent ?? '').trim())),
  133 |     );
  134 |     return cells.map(([id, severity, title, owner]) => ({ id: Number(id), severity, title, owner }));
  135 |   }
  136 | 
  137 |   async rowsContaining(token: string): Promise<BoardRow[]> {
  138 |     return (await this.rows()).filter((r) => r.title.includes(token));
  139 |   }
  140 | 
  141 |   async rowCount(title: string): Promise<number> {
  142 |     return this.rowFor(title).count();
  143 |   }
  144 | 
  145 |   async severityBadgeStyle(title: string) {
  146 |     return this.rowFor(title)
  147 |       .locator('.severity-badge')
  148 |       .evaluate((el) => {
  149 |         const s = getComputedStyle(el);
  150 |         return { color: s.color, background: s.backgroundColor, fontWeight: Number(s.fontWeight) };
  151 |       });
  152 |   }
  153 | 
  154 |   async severityTokens(): Promise<string[]> {
  155 |     return this.page.evaluate(() => {
  156 |       const s = getComputedStyle(document.documentElement);
  157 |       return ['high', 'mid', 'low'].map((level) => s.getPropertyValue(`--color-severity-${level}`).trim());
  158 |     });
  159 |   }
  160 | 
  161 |   async filterBackground(state: 'open' | 'closed'): Promise<string> {
  162 |     return (state === 'open' ? this.openFilter : this.closedFilter).evaluate((el) => getComputedStyle(el).backgroundColor);
  163 |   }
  164 | 
  165 |   async logoBoxRadius(): Promise<string> {
  166 |     return this.titleBarLogo.locator('..').evaluate((el) => getComputedStyle(el).borderRadius);
  167 |   }
  168 | 
  169 |   // Horizontal distance from the logo's right edge to the title's left edge; negative if the title is left of the logo.
  170 |   async logoToTitleGap(): Promise<number> {
  171 |     const logo = await box(this.titleBarLogo);
  172 |     const title = await box(this.titleBarHeading);
  173 |     return title.x - (logo.x + logo.width);
  174 |   }
  175 | 
  176 |   async logoutRightInset(): Promise<number> {
  177 |     const header = await box(this.header);
  178 |     const logout = await box(this.logoutButton);
  179 |     return header.x + header.width - (logout.x + logout.width);
  180 |   }
  181 | 
  182 |   private sortButton(column: Column): Locator {
  183 |     return this.headerCells.getByRole('button', { name: new RegExp(`^${column}`) });
  184 |   }
  185 | 
  186 |   private rowFor(title: string): Locator {
  187 |     const exact = new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  188 |     return this.bugRows.filter({ has: this.page.locator('td:nth-child(3)', { hasText: exact }) });
  189 |   }
  190 | }
  191 | 
```