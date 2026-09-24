# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/id-parsing.spec.ts >> GET /api/bugs/<id>abc returns 400 invalid_id
- Location: tests/api/id-parsing.spec.ts:14:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 200
```

# Test source

```ts
  1  | import { test, expect, uid } from '../fixtures';
  2  | 
  3  | test('a non-numeric id returns 400 invalid_id', async ({ bugApi }) => {
  4  |   for (const method of ['GET', 'PUT', 'DELETE'] as const) {
  5  |     const res = await bugApi.send(method, '/api/bugs/abc', { data: {} });
  6  | 
  7  |     expect(res.status(), method).toBe(400);
  8  |     expect(await res.json()).toMatchObject({ error: 'invalid_id' });
  9  |   }
  10 | });
  11 | 
  12 | // parseInt accepts a numeric prefix, so these reach a real bug instead of being rejected.
  13 | for (const suffix of ['abc', '.9', 'e5']) {
  14 |   test(`GET /api/bugs/<id>${suffix} returns 400 invalid_id`, async ({ bugApi }) => {
  15 |     test.fail(true, 'Known contract break: an id with trailing characters resolves to the leading number.');
  16 |     const bug = await bugApi.create(`id ${uid()}`);
  17 | 
  18 |     const res = await bugApi.send('GET', `/api/bugs/${bug.id}${suffix}`);
  19 | 
> 20 |     expect(res.status()).toBe(400);
     |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  21 |   });
  22 | }
  23 | 
  24 | test('DELETE /api/bugs/<id>abc does not delete the bug', async ({ bugApi }) => {
  25 |   test.fail(true, 'Known contract break: DELETE /api/bugs/<id>abc deletes bug <id>.');
  26 |   const bug = await bugApi.create(`id delete ${uid()}`);
  27 | 
  28 |   await bugApi.send('DELETE', `/api/bugs/${bug.id}abc`);
  29 | 
  30 |   expect(await bugApi.get(bug.id)).not.toBeNull();
  31 | });
  32 | 
  33 | for (const id of ['-1', '0x1']) {
  34 |   test(`GET /api/bugs/${id} returns 400 invalid_id`, async ({ bugApi }) => {
  35 |     test.fail(true, 'Known contract break: negative and hex ids return 404 not_found instead of 400.');
  36 | 
  37 |     const res = await bugApi.send('GET', `/api/bugs/${id}`);
  38 | 
  39 |     expect(res.status()).toBe(400);
  40 |   });
  41 | }
  42 | 
```