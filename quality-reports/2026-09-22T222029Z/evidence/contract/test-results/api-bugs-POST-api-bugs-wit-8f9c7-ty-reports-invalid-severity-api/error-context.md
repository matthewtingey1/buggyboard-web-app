# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/bugs.spec.ts >> POST /api/bugs with an unknown severity reports invalid_severity
- Location: tests/api/bugs.spec.ts:54:1

# Error details

```
Error: expect(received).toMatchObject(expected)

- Expected  - 1
+ Received  + 1

  Object {
-   "error": "invalid_severity",
+   "error": "blank_severity",
  }
```

# Test source

```ts
  1   | import { test, expect, PREFIX, uid } from '../fixtures';
  2   | 
  3   | const valid = () => ({ title: `${PREFIX} api ${uid()}`, severity: 'mid', owner: 'buggy', description: 'contract test' });
  4   | 
  5   | test('GET /api/health reports the API and database are up', async ({ bugApi }) => {
  6   |   const res = await bugApi.send('GET', '/api/health');
  7   | 
  8   |   expect(res.status()).toBe(200);
  9   |   expect(await res.json()).toMatchObject({ ok: true, database: 'connected' });
  10  | });
  11  | 
  12  | test('GET /api/bugs returns an array of bugs', async ({ bugApi }) => {
  13  |   await bugApi.create(`listed ${uid()}`);
  14  | 
  15  |   const res = await bugApi.send('GET', '/api/bugs');
  16  | 
  17  |   expect(res.status()).toBe(200);
  18  |   const body = await res.json();
  19  |   expect(Array.isArray(body)).toBe(true);
  20  |   expect(body[0]).toEqual(expect.objectContaining({ id: expect.any(Number), title: expect.any(String), state: expect.any(String) }));
  21  | });
  22  | 
  23  | test('POST /api/bugs returns 201 with the new bug, upper-cased and Open', async ({ bugApi }) => {
  24  |   const input = { ...valid(), severity: ' High ' };
  25  | 
  26  |   const res = await bugApi.send('POST', '/api/bugs', { data: { ...input, state: 'closed' } });
  27  | 
  28  |   expect(res.status()).toBe(201);
  29  |   const bug = await res.json();
  30  |   bugApi.track(bug.id);
  31  |   expect(bug).toMatchObject({ id: expect.any(Number), title: input.title, severity: 'HIGH', owner: 'buggy', state: 'OPEN' });
  32  | });
  33  | 
  34  | for (const field of ['title', 'severity', 'owner', 'description'] as const) {
  35  |   test(`POST /api/bugs without ${field} returns 400 blank_${field}`, async ({ bugApi }) => {
  36  |     const body = Object.fromEntries(Object.entries(valid()).filter(([key]) => key !== field));
  37  | 
  38  |     const res = await bugApi.send('POST', '/api/bugs', { data: body });
  39  | 
  40  |     expect(res.status()).toBe(400);
  41  |     expect(await res.json()).toMatchObject({ error: `blank_${field}` });
  42  |   });
  43  | 
  44  |   if (field !== 'severity') {
  45  |     test(`POST /api/bugs with a whitespace-only ${field} returns 400 blank_${field}`, async ({ bugApi }) => {
  46  |       const res = await bugApi.send('POST', '/api/bugs', { data: { ...valid(), [field]: '   ' } });
  47  | 
  48  |       expect(res.status()).toBe(400);
  49  |       expect(await res.json()).toMatchObject({ error: `blank_${field}` });
  50  |     });
  51  |   }
  52  | }
  53  | 
  54  | test('POST /api/bugs with an unknown severity reports invalid_severity', async ({ bugApi }) => {
  55  |   test.fail(true, 'Known contract break: an invalid severity is reported as blank_severity.');
  56  | 
  57  |   const res = await bugApi.send('POST', '/api/bugs', { data: { ...valid(), severity: 'critical' } });
  58  | 
  59  |   expect(res.status()).toBe(400);
> 60  |   expect(await res.json()).toMatchObject({ error: 'invalid_severity' });
      |                            ^ Error: expect(received).toMatchObject(expected)
  61  | });
  62  | 
  63  | test('GET /api/bugs/:id returns the bug', async ({ bugApi }) => {
  64  |   const bug = await bugApi.create(`read ${uid()}`);
  65  | 
  66  |   const res = await bugApi.send('GET', `/api/bugs/${bug.id}`);
  67  | 
  68  |   expect(res.status()).toBe(200);
  69  |   expect(await res.json()).toEqual(bug);
  70  | });
  71  | 
  72  | test('GET /api/bugs/:id for a missing bug returns 404 not_found', async ({ bugApi }) => {
  73  |   const res = await bugApi.send('GET', '/api/bugs/999999999');
  74  | 
  75  |   expect(res.status()).toBe(404);
  76  |   expect(await res.json()).toMatchObject({ error: 'not_found' });
  77  | });
  78  | 
  79  | test('PUT /api/bugs/:id replaces the bug and normalises state', async ({ bugApi }) => {
  80  |   const bug = await bugApi.create(`put ${uid()}`);
  81  | 
  82  |   const res = await bugApi.send('PUT', `/api/bugs/${bug.id}`, {
  83  |     data: { title: bug.title, severity: 'low', owner: 'vanny', description: 'replaced', state: ' closed ' },
  84  |   });
  85  | 
  86  |   expect(res.status()).toBe(200);
  87  |   expect(await bugApi.get(bug.id)).toMatchObject({ severity: 'LOW', owner: 'vanny', description: 'replaced', state: 'CLOSED' });
  88  | });
  89  | 
  90  | test('PUT /api/bugs/:id ignores an id in the body', async ({ bugApi }) => {
  91  |   const bug = await bugApi.create(`put id ${uid()}`);
  92  | 
  93  |   const res = await bugApi.send('PUT', `/api/bugs/${bug.id}`, { data: { ...bug, id: bug.id + 100000, description: 'path wins' } });
  94  | 
  95  |   expect(res.status()).toBe(200);
  96  |   expect(await bugApi.get(bug.id)).toMatchObject({ id: bug.id, description: 'path wins' });
  97  | });
  98  | 
  99  | for (const [name, state] of [['missing', undefined], ['invalid', 'pending'], ['blank', '']] as const) {
  100 |   test(`PUT /api/bugs/:id with a ${name} state returns 400 invalid_state`, async ({ bugApi }) => {
  101 |     const bug = await bugApi.create(`put state ${uid()}`);
  102 | 
  103 |     const res = await bugApi.send('PUT', `/api/bugs/${bug.id}`, { data: { ...bug, state } });
  104 | 
  105 |     expect(res.status()).toBe(400);
  106 |     expect(await res.json()).toMatchObject({ error: 'invalid_state' });
  107 |   });
  108 | }
  109 | 
  110 | test('PUT /api/bugs/:id is a full replacement, not a patch', async ({ bugApi }) => {
  111 |   const bug = await bugApi.create(`put partial ${uid()}`);
  112 | 
  113 |   const res = await bugApi.send('PUT', `/api/bugs/${bug.id}`, { data: { title: 'only a title' } });
  114 | 
  115 |   expect(res.status()).toBe(400);
  116 |   expect(await bugApi.get(bug.id)).toEqual(bug);
  117 | });
  118 | 
  119 | test('PUT /api/bugs/:id for a missing bug returns 404 not_found', async ({ bugApi }) => {
  120 |   const res = await bugApi.send('PUT', '/api/bugs/999999999', { data: { ...valid(), state: 'open' } });
  121 | 
  122 |   expect(res.status()).toBe(404);
  123 |   expect(await res.json()).toMatchObject({ error: 'not_found' });
  124 | });
  125 | 
  126 | test('DELETE /api/bugs/:id returns 204 and the bug is gone', async ({ bugApi }) => {
  127 |   const bug = await bugApi.create(`delete ${uid()}`);
  128 | 
  129 |   const res = await bugApi.send('DELETE', `/api/bugs/${bug.id}`);
  130 | 
  131 |   expect(res.status()).toBe(204);
  132 |   expect(await res.text()).toBe('');
  133 |   expect(await bugApi.get(bug.id)).toBeNull();
  134 | });
  135 | 
  136 | test('DELETE /api/bugs/:id twice returns 404 the second time', async ({ bugApi }) => {
  137 |   const bug = await bugApi.create(`delete twice ${uid()}`);
  138 |   await bugApi.send('DELETE', `/api/bugs/${bug.id}`);
  139 | 
  140 |   const res = await bugApi.send('DELETE', `/api/bugs/${bug.id}`);
  141 | 
  142 |   expect(res.status()).toBe(404);
  143 |   expect(await res.json()).toMatchObject({ error: 'not_found' });
  144 | });
  145 | 
```