# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/auth.spec.ts >> DELETE /api/bugs/:id without a session leaves the bug in place
- Location: tests/api/auth.spec.ts:21:1

# Error details

```
Error: expect(received).not.toBeNull()

Received: null
```

# Test source

```ts
  1  | import { test, expect, PREFIX, uid } from '../fixtures';
  2  | 
  3  | // The request fixture carries no session, so every call here is anonymous.
  4  | test('GET /api/bugs without a session returns 401', async ({ bugApi }) => {
  5  |   test.fail(true, 'Known security defect: /api/bugs has no server-side authentication.');
  6  | 
  7  |   const res = await bugApi.send('GET', '/api/bugs');
  8  | 
  9  |   expect(res.status()).toBe(401);
  10 | });
  11 | 
  12 | test('POST /api/bugs without a session returns 401', async ({ bugApi }) => {
  13 |   test.fail(true, 'Known security defect: /api/bugs has no server-side authentication.');
  14 | 
  15 |   const res = await bugApi.createRaw({ title: `${PREFIX} anon ${uid()}`, severity: 'low', owner: 'buggy', description: 'd' });
  16 |   if (res.ok()) bugApi.track((await res.json()).id);
  17 | 
  18 |   expect(res.status()).toBe(401);
  19 | });
  20 | 
  21 | test('DELETE /api/bugs/:id without a session leaves the bug in place', async ({ bugApi }) => {
  22 |   test.fail(true, 'Known security defect: /api/bugs has no server-side authentication.');
  23 |   const bug = await bugApi.create(`anon delete ${uid()}`);
  24 | 
  25 |   await bugApi.send('DELETE', `/api/bugs/${bug.id}`);
  26 | 
> 27 |   expect(await bugApi.get(bug.id)).not.toBeNull();
     |                                        ^ Error: expect(received).not.toBeNull()
  28 | });
  29 | 
  30 | test('responses do not advertise the server framework', async ({ bugApi }) => {
  31 |   test.fail(true, 'Known hardening gap: responses carry X-Powered-By: Express.');
  32 | 
  33 |   const res = await bugApi.send('GET', '/api/health');
  34 | 
  35 |   expect(res.headers()['x-powered-by']).toBeUndefined();
  36 | });
  37 | 
```