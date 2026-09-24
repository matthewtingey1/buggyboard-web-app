# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: create-bug/create-bug.spec.ts >> closing with Escape does not save the bug
- Location: tests/create-bug/create-bug.spec.ts:62:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('header').getByRole('button', { name: 'New Bug', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - img "BuggyBoard" [ref=e7]
      - heading "BuggyBoard" [active] [level=1] [ref=e8]
    - generic [ref=e9]:
      - search [ref=e10]:
        - textbox "Search bugs by title" [ref=e11]:
          - /placeholder: Search bugs…
      - button "Report Bug" [ref=e13] [cursor=pointer]
      - button "Logout" [ref=e15] [cursor=pointer]
  - main [ref=e16]:
    - generic [ref=e17]:
      - group "Filter by bug state" [ref=e19]:
        - button "Open" [pressed] [ref=e20] [cursor=pointer]
        - button "Closed" [ref=e21] [cursor=pointer]
      - status [ref=e22]: 3 open bugs shown.
      - region "Bug table" [ref=e24]:
        - table "Bugs" [ref=e25]:
          - rowgroup [ref=e26]:
            - row [ref=e27]:
              - columnheader [ref=e28]:
                - button "ID" [ref=e29] [cursor=pointer]
              - columnheader [ref=e31]:
                - button "Severity" [ref=e32] [cursor=pointer]:
                  - text: Severity
                  - generic [aria-hidden] [ref=e33]: ↓
              - columnheader [ref=e34]:
                - button "Title" [ref=e35] [cursor=pointer]
              - columnheader [ref=e37]:
                - button "Owner" [ref=e38] [cursor=pointer]
          - rowgroup [ref=e40]:
            - row [ref=e41] [cursor=pointer]:
              - cell "2" [ref=e42]
              - cell "HIGH" [ref=e43]
              - cell [ref=e45]:
                - button "Bug API endpoints work without logging in" [ref=e46]
              - cell "matt" [ref=e47]
            - row [ref=e48] [cursor=pointer]:
              - cell "3" [ref=e49]
              - cell "MID" [ref=e50]
              - cell [ref=e52]:
                - button "Search does not match on bug description" [ref=e53]
              - cell "matt" [ref=e54]
            - row [ref=e55] [cursor=pointer]:
              - cell "1" [ref=e56]
              - cell "LOW" [ref=e57]
              - cell [ref=e59]:
                - button "Login page accepts username with trailing spaces" [ref=e60]
              - cell "matt" [ref=e61]
```

# Test source

```ts
  57  |     // Bug rows are the ones with a title button; loading, empty and error rows have none.
  58  |     this.bugRows = this.bugTable.locator('tbody tr').filter({ has: page.locator('td button') });
  59  |     this.noMatchesMessage = this.bugTable.getByText('No bugs matched.');
  60  |     this.loadingMessage = this.bugTable.getByText('Loading…');
  61  |     this.loadError = this.bugTable.getByText("Couldn't load bugs.");
  62  |     this.noBugsMessage = this.bugTable.getByText('No bugs.', { exact: true });
  63  |     this.noticeMessage = page.locator('main p.text-red-700');
  64  |     this.statusMessage = page.getByRole('status');
  65  |     this.searchTextbox = page.getByRole('textbox', { name: 'Search bugs by title' });
  66  |     this.tableRowsByRole = this.bugTable.getByRole('row');
  67  |   }
  68  | 
  69  |   // Network control for failure-handling tests. Only bug writes are affected; the board still loads.
  70  |   async delayBugWrites(ms: number) {
  71  |     await this.page.route('**/api/bugs**', async (route) => {
  72  |       if (route.request().method() !== 'GET') await new Promise((r) => setTimeout(r, ms));
  73  |       await route.fallback();
  74  |     });
  75  |   }
  76  | 
  77  |   async abortBugWrites() {
  78  |     await this.page.route('**/api/bugs**', (route) =>
  79  |       route.request().method() === 'GET' ? route.fallback() : route.abort('failed'),
  80  |     );
  81  |   }
  82  | 
  83  |   async openBugWithKeyboard(title: string) {
  84  |     await this.rowFor(title).getByRole('button').focus();
  85  |     await this.page.keyboard.press('Enter');
  86  |   }
  87  | 
  88  |   async failBugList() {
  89  |     await this.page.route('**/api/bugs', (route) =>
  90  |       route.request().method() === 'GET' ? route.fulfill({ status: 500, body: '{}' }) : route.fallback(),
  91  |     );
  92  |   }
  93  | 
  94  |   // Holds the GET for one bug so a later click can overtake it.
  95  |   async delayBugRead(id: number, ms: number) {
  96  |     await this.page.route(`**/api/bugs/${id}`, async (route) => {
  97  |       if (route.request().method() === 'GET') await new Promise((r) => setTimeout(r, ms));
  98  |       await route.fallback();
  99  |     });
  100 |   }
  101 | 
  102 |   async rowRoleCount(title: string): Promise<number> {
  103 |     return this.bugTable.getByRole('row', { name: title }).count();
  104 |   }
  105 | 
  106 |   // Enter held down on New Bug: the first keydown opens the modal, the repeats land in its form.
  107 |   async holdEnterOnNewBug() {
  108 |     await this.newBugButton.focus();
  109 |     await this.page.keyboard.down('Enter');
  110 |     await this.page.keyboard.down('Enter');
  111 |     await this.page.keyboard.down('Enter');
  112 |     await this.page.keyboard.up('Enter');
  113 |   }
  114 | 
  115 |   async bugReadFinished(id: number) {
  116 |     await this.page.waitForResponse((res) => res.url().endsWith(`/api/bugs/${id}`) && res.request().method() === 'GET');
  117 |   }
  118 | 
  119 |   async openInNewTab(): Promise<BoardPage> {
  120 |     const tab = new BoardPage(await this.page.context().newPage());
  121 |     await tab.goto();
  122 |     return tab;
  123 |   }
  124 | 
  125 |   async scriptInjectionFired(): Promise<boolean> {
  126 |     return this.page.evaluate(() => (window as unknown as { __xss?: boolean }).__xss === true);
  127 |   }
  128 | 
  129 |   async goto() {
  130 |     await this.page.goto('/board');
  131 |     await this.waitLoaded();
  132 |   }
  133 | 
  134 |   async visit(path: string) {
  135 |     await this.page.goto(path);
  136 |   }
  137 | 
  138 |   async reload() {
  139 |     await this.page.reload();
  140 |   }
  141 | 
  142 |   async goBack() {
  143 |     await this.page.goBack();
  144 |     await this.page.waitForLoadState();
  145 |   }
  146 | 
  147 |   async waitLoaded() {
  148 |     await this.bugTable.waitFor();
  149 |     await this.loadingMessage.waitFor({ state: 'detached' });
  150 |   }
  151 | 
  152 |   async logout() {
  153 |     await this.logoutButton.click();
  154 |   }
  155 | 
  156 |   async openNewBug() {
> 157 |     await this.newBugButton.click();
      |                             ^ Error: locator.click: Test timeout of 30000ms exceeded.
  158 |   }
  159 | 
  160 |   async openNewBugWithKeyboard() {
  161 |     await this.newBugButton.focus();
  162 |     await this.page.keyboard.press('Enter');
  163 |   }
  164 | 
  165 |   async openBug(title: string) {
  166 |     await this.rowFor(title).click();
  167 |   }
  168 | 
  169 |   async search(text: string) {
  170 |     await this.searchInput.fill(text);
  171 |   }
  172 | 
  173 |   async clearSearch() {
  174 |     await this.clearSearchButton.click();
  175 |   }
  176 | 
  177 |   async showOpen() {
  178 |     await this.openFilter.click();
  179 |   }
  180 | 
  181 |   async showClosed() {
  182 |     await this.closedFilter.click();
  183 |   }
  184 | 
  185 |   async sortBy(column: Column) {
  186 |     await this.sortButton(column).click();
  187 |   }
  188 | 
  189 |   async sortIndicator(column: Column): Promise<string> {
  190 |     return ((await this.sortButton(column).locator('span').textContent()) ?? '').replace(/\s/g, '');
  191 |   }
  192 | 
  193 |   async headerNames(): Promise<string[]> {
  194 |     return (await this.headerCells.allTextContents()).map((t) => t.replace(/[↑↓\s]/g, ''));
  195 |   }
  196 | 
  197 |   async rows(): Promise<BoardRow[]> {
  198 |     const cells = await this.bugRows.evaluateAll((trs) =>
  199 |       trs.map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => (td.textContent ?? '').trim())),
  200 |     );
  201 |     return cells.map(([id, severity, title, owner]) => ({ id: Number(id), severity, title, owner }));
  202 |   }
  203 | 
  204 |   async rowsContaining(token: string): Promise<BoardRow[]> {
  205 |     return (await this.rows()).filter((r) => r.title.includes(token));
  206 |   }
  207 | 
  208 |   async rowCount(title: string): Promise<number> {
  209 |     return this.rowFor(title).count();
  210 |   }
  211 | 
  212 |   async severityBadgeStyle(title: string) {
  213 |     return this.rowFor(title)
  214 |       .locator('.severity-badge')
  215 |       .evaluate((el) => {
  216 |         const s = getComputedStyle(el);
  217 |         return { color: s.color, background: s.backgroundColor, fontWeight: Number(s.fontWeight) };
  218 |       });
  219 |   }
  220 | 
  221 |   async severityTokens(): Promise<string[]> {
  222 |     return this.page.evaluate(() => {
  223 |       const s = getComputedStyle(document.documentElement);
  224 |       return ['high', 'mid', 'low'].map((level) => s.getPropertyValue(`--color-severity-${level}`).trim());
  225 |     });
  226 |   }
  227 | 
  228 |   async filterBackground(state: 'open' | 'closed'): Promise<string> {
  229 |     return (state === 'open' ? this.openFilter : this.closedFilter).evaluate((el) => getComputedStyle(el).backgroundColor);
  230 |   }
  231 | 
  232 |   async logoBoxRadius(): Promise<string> {
  233 |     return this.titleBarLogo.locator('..').evaluate((el) => getComputedStyle(el).borderRadius);
  234 |   }
  235 | 
  236 |   // Horizontal distance from the logo's right edge to the title's left edge; negative if the title is left of the logo.
  237 |   async logoToTitleGap(): Promise<number> {
  238 |     const logo = await box(this.titleBarLogo);
  239 |     const title = await box(this.titleBarHeading);
  240 |     return title.x - (logo.x + logo.width);
  241 |   }
  242 | 
  243 |   async logoutRightInset(): Promise<number> {
  244 |     const header = await box(this.header);
  245 |     const logout = await box(this.logoutButton);
  246 |     return header.x + header.width - (logout.x + logout.width);
  247 |   }
  248 | 
  249 |   private sortButton(column: Column): Locator {
  250 |     return this.headerCells.getByRole('button', { name: new RegExp(`^${column}`) });
  251 |   }
  252 | 
  253 |   private rowFor(title: string): Locator {
  254 |     const exact = new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  255 |     return this.bugRows.filter({ has: this.page.locator('td:nth-child(3)', { hasText: exact }) });
  256 |   }
  257 | }
```