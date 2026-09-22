import { test, expect, PREFIX, uid } from '../fixtures';

const samples: Record<string, string> = {
  'Latin-1 accents': 'Crème brûlée à la façade',
  CJK: '登录失败 ログイン失敗',
  'emoji and ZWJ sequences': 'Bug 🐞 👩\u200D💻 🇺🇸',
  'right-to-left text': 'خطأ في تسجيل الدخول',
  'HTML markup': '<img src=x onerror="alert(1)"><b>bold</b>',
  'quotes and backslashes': `He said "it's \\broken\\"`,
  'SQL metacharacters': "x'; DROP TABLE bugs; --",
  'a 10,000-character value': 'x'.repeat(10_000),
};

for (const [name, value] of Object.entries(samples)) {
  for (const field of ['title', 'owner', 'description'] as const) {
    test(`${field} with ${name} reads back unchanged`, async ({ bugApi }) => {
      const token = uid();
      const fields = { title: `${PREFIX} rt ${token}`, owner: 'buggy', description: 'round trip' };
      fields[field] = field === 'title' ? `${PREFIX} ${value} ${token}` : value;

      const res = await bugApi.createRaw({ ...fields, severity: 'low' });
      const created = await res.json();

      expect(res.status()).toBe(201);
      expect((await bugApi.get(created.id))?.[field]).toBe(fields[field]);
    });
  }
}

test('a multi-line description keeps its line breaks', async ({ bugApi }) => {
  const description = 'line one\nline two\r\nline three\ttabbed';

  const bug = await bugApi.create(`multiline ${uid()}`, { description });

  expect(bug.description).toBe(description);
});

test('line breaks in a title are stored as a single space', async ({ bugApi }) => {
  const token = uid();

  const res = await bugApi.createRaw({ title: `${PREFIX} line1\r\n  line2\nline3 ${token}`, severity: 'low', owner: 'buggy', description: 'd' });

  expect(res.status()).toBe(201);
  expect((await res.json()).title).toBe(`${PREFIX} line1 line2 line3 ${token}`);
});

test('leading and trailing whitespace is trimmed from stored fields', async ({ bugApi }) => {
  const token = uid();

  const res = await bugApi.createRaw({ title: `  ${PREFIX} trim ${token}  `, severity: 'low', owner: '  buggy ', description: '\n desc \n' });
  const created = await res.json();

  expect(await bugApi.get(created.id)).toMatchObject({ title: `${PREFIX} trim ${token}`, owner: 'buggy', description: 'desc' });
});

test('an update reads back exactly as written', async ({ bugApi }) => {
  const bug = await bugApi.create(`update ${uid()}`);
  const changes = { title: `${bug.title} ✏️`, severity: 'HIGH', owner: 'vanny', description: 'changed\nagain', state: 'CLOSED' };

  await bugApi.update(bug.id, changes);

  expect(await bugApi.get(bug.id)).toEqual({ id: bug.id, ...changes });
});

test('a deleted bug\'s id is not reused', async ({ bugApi }) => {
  const first = await bugApi.create(`id reuse ${uid()}`);
  await bugApi.send('DELETE', `/api/bugs/${first.id}`);

  const second = await bugApi.create(`id reuse ${uid()}`);

  expect(second.id).toBeGreaterThan(first.id);
});

test('an edit to a bug deleted elsewhere returns 404 and does not recreate it', async ({ bugApi }) => {
  const bug = await bugApi.create(`deleted elsewhere ${uid()}`);
  await bugApi.send('DELETE', `/api/bugs/${bug.id}`);

  const res = await bugApi.send('PUT', `/api/bugs/${bug.id}`, { data: { ...bug, description: 'resurrect?' } });

  expect(res.status()).toBe(404);
  expect(await bugApi.get(bug.id)).toBeNull();
});

test('a zero-width-space-only title is rejected as blank', async ({ bugApi }) => {

  const res = await bugApi.createRaw({ title: '\u200B', severity: 'low', owner: 'buggy', description: 'zero width' });

  expect(res.status()).toBe(400);
});
