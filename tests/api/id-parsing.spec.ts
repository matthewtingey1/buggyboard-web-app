import { test, expect, uid } from '../fixtures';

test('a non-numeric id returns 400 invalid_id', async ({ bugApi }) => {
  for (const method of ['GET', 'PUT', 'DELETE'] as const) {
    const res = await bugApi.send(method, '/api/bugs/abc', { data: {} });

    expect(res.status(), method).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'invalid_id' });
  }
});

// Ids with trailing characters used to resolve to their numeric prefix and act on a real bug.
for (const suffix of ['abc', '.9', 'e5']) {
  test(`GET /api/bugs/<id>${suffix} returns 400 invalid_id`, async ({ bugApi }) => {
    const bug = await bugApi.create(`id ${uid()}`);

    const res = await bugApi.send('GET', `/api/bugs/${bug.id}${suffix}`);

    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'invalid_id' });
  });
}

test('PUT /api/bugs/<id>abc is rejected and leaves the bug unchanged', async ({ bugApi }) => {
  const bug = await bugApi.create(`id put ${uid()}`);

  const res = await bugApi.send('PUT', `/api/bugs/${bug.id}abc`, { data: { ...bug, description: 'overwritten?' } });

  expect(res.status()).toBe(400);
  expect(await bugApi.get(bug.id)).toEqual(bug);
});

test('DELETE /api/bugs/<id>abc does not delete the bug', async ({ bugApi }) => {
  const bug = await bugApi.create(`id delete ${uid()}`);

  await bugApi.send('DELETE', `/api/bugs/${bug.id}abc`);

  expect(await bugApi.get(bug.id)).not.toBeNull();
});

for (const id of ['-1', '0x1']) {
  test(`GET /api/bugs/${id} returns 400 invalid_id`, async ({ bugApi }) => {
    const res = await bugApi.send('GET', `/api/bugs/${id}`);

    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'invalid_id' });
  });
}
