# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: data/round-trip.spec.ts >> a zero-width-space-only title is rejected as blank
- Location: tests/data/round-trip.spec.ts:77:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 201
```

# Test source

```ts
  1  | import { test, expect, PREFIX, uid } from '../fixtures';
  2  | 
  3  | const samples: Record<string, string> = {
  4  |   'Latin-1 accents': 'Crème brûlée à la façade',
  5  |   CJK: '登录失败 ログイン失敗',
  6  |   'emoji and ZWJ sequences': 'Bug 🐞 👩‍💻 🇺🇸',
  7  |   'right-to-left text': 'خطأ في تسجيل الدخول',
  8  |   'HTML markup': '<img src=x onerror="alert(1)"><b>bold</b>',
  9  |   'quotes and backslashes': `He said "it's \\broken\\"`,
  10 |   'SQL metacharacters': "x'; DROP TABLE bugs; --",
  11 |   'a 10,000-character value': 'x'.repeat(10_000),
  12 | };
  13 | 
  14 | for (const [name, value] of Object.entries(samples)) {
  15 |   for (const field of ['title', 'owner', 'description'] as const) {
  16 |     test(`${field} with ${name} reads back unchanged`, async ({ bugApi }) => {
  17 |       const token = uid();
  18 |       const fields = { title: `${PREFIX} rt ${token}`, owner: 'buggy', description: 'round trip' };
  19 |       fields[field] = field === 'title' ? `${PREFIX} ${value} ${token}` : value;
  20 | 
  21 |       const res = await bugApi.createRaw({ ...fields, severity: 'low' });
  22 |       const created = await res.json();
  23 |       bugApi.track(created.id);
  24 | 
  25 |       expect(res.status()).toBe(201);
  26 |       expect((await bugApi.get(created.id))?.[field]).toBe(fields[field]);
  27 |     });
  28 |   }
  29 | }
  30 | 
  31 | test('a multi-line description keeps its line breaks', async ({ bugApi }) => {
  32 |   const description = 'line one\nline two\r\nline three\ttabbed';
  33 | 
  34 |   const bug = await bugApi.create(`multiline ${uid()}`, { description });
  35 | 
  36 |   expect(bug.description).toBe(description);
  37 | });
  38 | 
  39 | test('leading and trailing whitespace is trimmed from stored fields', async ({ bugApi }) => {
  40 |   const token = uid();
  41 | 
  42 |   const res = await bugApi.createRaw({ title: `  ${PREFIX} trim ${token}  `, severity: 'low', owner: '  buggy ', description: '\n desc \n' });
  43 |   const created = await res.json();
  44 |   bugApi.track(created.id);
  45 | 
  46 |   expect(await bugApi.get(created.id)).toMatchObject({ title: `${PREFIX} trim ${token}`, owner: 'buggy', description: 'desc' });
  47 | });
  48 | 
  49 | test('an update reads back exactly as written', async ({ bugApi }) => {
  50 |   const bug = await bugApi.create(`update ${uid()}`);
  51 |   const changes = { title: `${bug.title} ✏️`, severity: 'HIGH', owner: 'vanny', description: 'changed\nagain', state: 'CLOSED' };
  52 | 
  53 |   await bugApi.update(bug.id, changes);
  54 | 
  55 |   expect(await bugApi.get(bug.id)).toEqual({ id: bug.id, ...changes });
  56 | });
  57 | 
  58 | test('a deleted bug\'s id is not reused', async ({ bugApi }) => {
  59 |   const first = await bugApi.create(`id reuse ${uid()}`);
  60 |   await bugApi.send('DELETE', `/api/bugs/${first.id}`);
  61 | 
  62 |   const second = await bugApi.create(`id reuse ${uid()}`);
  63 | 
  64 |   expect(second.id).toBeGreaterThan(first.id);
  65 | });
  66 | 
  67 | test('an edit to a bug deleted elsewhere returns 404 and does not recreate it', async ({ bugApi }) => {
  68 |   const bug = await bugApi.create(`deleted elsewhere ${uid()}`);
  69 |   await bugApi.send('DELETE', `/api/bugs/${bug.id}`);
  70 | 
  71 |   const res = await bugApi.send('PUT', `/api/bugs/${bug.id}`, { data: { ...bug, description: 'resurrect?' } });
  72 | 
  73 |   expect(res.status()).toBe(404);
  74 |   expect(await bugApi.get(bug.id)).toBeNull();
  75 | });
  76 | 
  77 | test('a zero-width-space-only title is rejected as blank', async ({ bugApi }) => {
  78 |   test.fail(true, 'Known defect: U+200B passes the "cannot be blank" check.');
  79 | 
  80 |   const res = await bugApi.createRaw({ title: '​', severity: 'low', owner: 'buggy', description: 'zero width' });
  81 |   if (res.ok()) bugApi.track((await res.json()).id);
  82 | 
> 83 |   expect(res.status()).toBe(400);
     |                        ^ Error: expect(received).toBe(expected) // Object.is equality
  84 | });
  85 | 
```