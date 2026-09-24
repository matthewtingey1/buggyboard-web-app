import { test, expect, PREFIX, uid } from '../fixtures';

const valid = () => ({ title: `${PREFIX} api ${uid()}`, severity: 'mid', owner: 'buggy', description: 'contract test' });

test('GET /api/health reports the API and database are up', async ({ bugApi }) => {
  const res = await bugApi.send('GET', '/api/health');

  expect(res.status()).toBe(200);
  expect(await res.json()).toMatchObject({ ok: true, database: 'connected' });
});

test('GET /api/bugs returns an array of bugs', async ({ bugApi }) => {
  await bugApi.create(`listed ${uid()}`);

  const res = await bugApi.send('GET', '/api/bugs');

  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body[0]).toEqual(expect.objectContaining({ id: expect.any(Number), title: expect.any(String), state: expect.any(String) }));
});

test('POST /api/bugs returns 201 with the new bug, upper-cased and Open', async ({ bugApi }) => {
  const input = { ...valid(), severity: ' High ' };

  const res = await bugApi.send('POST', '/api/bugs', { data: { ...input, state: 'closed' } });

  expect(res.status()).toBe(201);
  const bug = await res.json();
  expect(bug).toMatchObject({ id: expect.any(Number), title: input.title, severity: 'HIGH', owner: 'buggy', state: 'OPEN' });
});

for (const field of ['title', 'severity', 'owner', 'description'] as const) {
  test(`POST /api/bugs without ${field} returns 400 blank_${field}`, async ({ bugApi }) => {
    const body = Object.fromEntries(Object.entries(valid()).filter(([key]) => key !== field));

    const res = await bugApi.send('POST', '/api/bugs', { data: body });

    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({ error: `blank_${field}` });
  });

  if (field !== 'severity') {
    test(`POST /api/bugs with a whitespace-only ${field} returns 400 blank_${field}`, async ({ bugApi }) => {
      const res = await bugApi.send('POST', '/api/bugs', { data: { ...valid(), [field]: '   ' } });

      expect(res.status()).toBe(400);
      expect(await res.json()).toMatchObject({ error: `blank_${field}` });
    });
  }
}

test('POST /api/bugs with an unknown severity reports invalid_severity', async ({ bugApi }) => {

  const res = await bugApi.send('POST', '/api/bugs', { data: { ...valid(), severity: 'critical' } });

  expect(res.status()).toBe(400);
  expect(await res.json()).toMatchObject({ error: 'invalid_severity' });
});

test('GET /api/bugs/:id returns the bug', async ({ bugApi }) => {
  const bug = await bugApi.create(`read ${uid()}`);

  const res = await bugApi.send('GET', `/api/bugs/${bug.id}`);

  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual(bug);
});

test('GET /api/bugs/:id for a missing bug returns 404 not_found', async ({ bugApi }) => {
  const res = await bugApi.send('GET', '/api/bugs/999999999');

  expect(res.status()).toBe(404);
  expect(await res.json()).toMatchObject({ error: 'not_found' });
});

test('PUT /api/bugs/:id replaces the bug and normalises state', async ({ bugApi }) => {
  const bug = await bugApi.create(`put ${uid()}`);

  const res = await bugApi.send('PUT', `/api/bugs/${bug.id}`, {
    data: { title: bug.title, severity: 'low', owner: 'vanny', description: 'replaced', state: ' closed ' },
  });

  expect(res.status()).toBe(200);
  expect(await bugApi.get(bug.id)).toMatchObject({ severity: 'LOW', owner: 'vanny', description: 'replaced', state: 'CLOSED' });
});

test('PUT /api/bugs/:id ignores an id in the body', async ({ bugApi }) => {
  const bug = await bugApi.create(`put id ${uid()}`);

  const res = await bugApi.send('PUT', `/api/bugs/${bug.id}`, { data: { ...bug, id: bug.id + 100000, description: 'path wins' } });

  expect(res.status()).toBe(200);
  expect(await bugApi.get(bug.id)).toMatchObject({ id: bug.id, description: 'path wins' });
});

for (const [name, state] of [['missing', undefined], ['invalid', 'pending'], ['blank', '']] as const) {
  test(`PUT /api/bugs/:id with a ${name} state returns 400 invalid_state`, async ({ bugApi }) => {
    const bug = await bugApi.create(`put state ${uid()}`);

    const res = await bugApi.send('PUT', `/api/bugs/${bug.id}`, { data: { ...bug, state } });

    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'invalid_state' });
  });
}

test('PUT /api/bugs/:id is a full replacement, not a patch', async ({ bugApi }) => {
  const bug = await bugApi.create(`put partial ${uid()}`);

  const res = await bugApi.send('PUT', `/api/bugs/${bug.id}`, { data: { title: 'only a title' } });

  expect(res.status()).toBe(400);
  expect(await bugApi.get(bug.id)).toEqual(bug);
});

test('PUT /api/bugs/:id for a missing bug returns 404 not_found', async ({ bugApi }) => {
  const res = await bugApi.send('PUT', '/api/bugs/999999999', { data: { ...valid(), state: 'open' } });

  expect(res.status()).toBe(404);
  expect(await res.json()).toMatchObject({ error: 'not_found' });
});

test('DELETE /api/bugs/:id returns 204 and the bug is gone', async ({ bugApi }) => {
  const bug = await bugApi.create(`delete ${uid()}`);

  const res = await bugApi.send('DELETE', `/api/bugs/${bug.id}`);

  expect(res.status()).toBe(204);
  expect(await res.text()).toBe('');
  expect(await bugApi.get(bug.id)).toBeNull();
});

test('DELETE /api/bugs/:id twice returns 404 the second time', async ({ bugApi }) => {
  const bug = await bugApi.create(`delete twice ${uid()}`);
  await bugApi.send('DELETE', `/api/bugs/${bug.id}`);

  const res = await bugApi.send('DELETE', `/api/bugs/${bug.id}`);

  expect(res.status()).toBe(404);
  expect(await res.json()).toMatchObject({ error: 'not_found' });
});
