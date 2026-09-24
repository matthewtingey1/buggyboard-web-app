# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: residue.spec.ts >> UI-style create registered with expectTitle, fails before read-back
- Location: quality-reports/2026-09-22T230611Z/evidence/data/residue/residue.spec.ts:17:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 2
Received: 1
```

# Test source

```ts
  1  | // Probes whether the bugApi fixture cleans up when a test fails after creating a bug.
  2  | // Titles use [e2e] because that is the prefix the fixture manages; the token lets the DB be checked afterwards.
  3  | import { test, expect, uid } from '../../../../../tests/fixtures';
  4  | 
  5  | const token = process.env.RESIDUE_TOKEN ?? uid();
  6  | 
  7  | test('assertion fails after bugApi.create', async ({ bugApi }) => {
  8  |   await bugApi.create(`[data]probe fail ${token}`);
  9  |   expect(1).toBe(2);
  10 | });
  11 | 
  12 | test('assertion fails after createRaw, before track()', async ({ bugApi }) => {
  13 |   const res = await bugApi.createRaw({ title: `[e2e] [data]probe raw ${token}`, severity: 'low', owner: 'buggy', description: 'd' });
  14 |   expect(res.status()).toBe(999);
  15 | });
  16 | 
  17 | test('UI-style create registered with expectTitle, fails before read-back', async ({ bugApi, request }) => {
  18 |   const title = `[e2e] [data]probe expect ${token}`;
  19 |   bugApi.expectTitle(title);
  20 |   await request.post('/api/bugs', { data: { title, severity: 'low', owner: 'buggy', description: 'd' } });
> 21 |   expect(1).toBe(2);
     |             ^ Error: expect(received).toBe(expected) // Object.is equality
  22 | });
  23 | 
  24 | test('UI-style create NOT registered (pattern of whitespace-only / 5.2 tests on regression)', async ({ bugApi, request }) => {
  25 |   await request.post('/api/bugs', { data: { title: `[e2e] [data]probe unregistered ${token}`, severity: 'low', owner: 'buggy', description: `blank ${token}` } });
  26 |   expect(await bugApi.findContaining(token)).toHaveLength(0);
  27 | });
  28 | 
  29 | test('expectTitle registered, but server stores a different (trimmed) title', async ({ bugApi, request }) => {
  30 |   const title = `[e2e] [data]probe mismatch ${token}`;
  31 |   bugApi.expectTitle(`${title} `);
  32 |   await request.post('/api/bugs', { data: { title, severity: 'low', owner: 'buggy', description: 'd' } });
  33 |   expect(1).toBe(2);
  34 | });
  35 | 
```