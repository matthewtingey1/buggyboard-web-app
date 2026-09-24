# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/error-bodies.spec.ts >> an unknown /api path returns a JSON 404
- Location: tests/api/error-bodies.spec.ts:16:1

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "application/json"
Received string:    "text/html; charset=utf-8"
```

# Test source

```ts
  1  | import { test, expect } from '../fixtures';
  2  | 
  3  | const json = { 'Content-Type': 'application/json' };
  4  | 
  5  | for (const [method, path] of [['POST', '/api/login'], ['POST', '/api/bugs']] as const) {
  6  |   test(`malformed JSON to ${method} ${path} returns a 400 JSON error`, async ({ bugApi }) => {
  7  |     test.fail(true, 'Known contract break: body-parser errors return an HTML page with a stack trace.');
  8  | 
  9  |     const res = await bugApi.send(method, path, { body: '{"title":', headers: json });
  10 | 
  11 |     expect(res.status()).toBe(400);
  12 |     expect(res.headers()['content-type']).toContain('application/json');
  13 |   });
  14 | }
  15 | 
  16 | test('an unknown /api path returns a JSON 404', async ({ bugApi }) => {
  17 |   test.fail(true, 'Known contract break: unknown /api paths return Express\'s HTML "Cannot GET" page.');
  18 | 
  19 |   const res = await bugApi.send('GET', '/api/no-such-route');
  20 | 
  21 |   expect(res.status()).toBe(404);
> 22 |   expect(res.headers()['content-type']).toContain('application/json');
     |                                         ^ Error: expect(received).toContain(expected) // indexOf
  23 | });
  24 | 
  25 | test('error responses never include a stack trace', async ({ bugApi }) => {
  26 |   test.fail(true, 'Known contract and security break: 400/500 HTML pages include stack traces with absolute paths.');
  27 | 
  28 |   const res = await bugApi.send('POST', '/api/login', { data: { username: 123, password: 'x' } });
  29 | 
  30 |   expect(await res.text()).not.toMatch(/at .+\.(ts|js):\d+/);
  31 | });
  32 | 
```