# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: residue.spec.ts >> assertion fails after bugApi.create
- Location: quality-reports/2026-09-22T222029Z/evidence/data/residue/residue.spec.ts:7:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 2
Received: 1
```

# Test source

```ts
  1  | // Probes whether the bugApi fixture cleans up when a test fails, times out, or creates before tracking.
  2  | // Titles use [e2e] because only that prefix is cleaned; each run token is printed so the DB can be checked afterwards.
  3  | import { test, expect, uid } from '../../../../../tests/fixtures';
  4  | 
  5  | const token = process.env.RESIDUE_TOKEN ?? uid();
  6  | 
  7  | test('assertion fails after bugApi.create', async ({ bugApi }) => {
  8  |   await bugApi.create(`[data]probe fail ${token}`);
> 9  |   expect(1).toBe(2);
     |             ^ Error: expect(received).toBe(expected) // Object.is equality
  10 | });
  11 | 
  12 | test('test times out after bugApi.create', async ({ bugApi }) => {
  13 |   test.setTimeout(1500);
  14 |   await bugApi.create(`[data]probe timeout ${token}`);
  15 |   await new Promise((r) => setTimeout(r, 5000));
  16 | });
  17 | 
  18 | test('assertion fails between a UI-style create and track()', async ({ bugApi }) => {
  19 |   const res = await bugApi.createRaw({ title: `[e2e] [data]probe untracked ${token}`, severity: 'low', owner: 'buggy', description: 'd' });
  20 |   expect(res.status()).toBe(999); // stands in for `expect(dialog).toBeHidden()` failing before findByTitle/track
  21 |   bugApi.track((await res.json()).id);
  22 | });
  23 | 
```