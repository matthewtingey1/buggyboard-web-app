import { test, expect, uid } from '../fixtures';

const json = { 'Content-Type': 'application/json' };

for (const [method, path] of [['POST', '/api/login'], ['POST', '/api/bugs']] as const) {
  test(`malformed JSON to ${method} ${path} returns a 400 JSON error`, async ({ bugApi }) => {

    const res = await bugApi.send(method, path, { body: '{"title":', headers: json });

    expect(res.status()).toBe(400);
    expect(res.headers()['content-type']).toContain('application/json');
  });
}

test('an unknown /api path returns a JSON 404', async ({ bugApi }) => {

  const res = await bugApi.send('GET', '/api/no-such-route');

  expect(res.status()).toBe(404);
  expect(res.headers()['content-type']).toContain('application/json');
});

test('a body-parser error never includes a stack trace', async ({ bugApi }) => {
  const res = await bugApi.send('POST', '/api/bugs', { body: '{"title":', headers: json });

  expect(res.status()).toBe(400);
  expect(await res.text()).not.toMatch(/at .+\.(ts|js):\d+/);
});

test('an unsupported method on a known path returns a JSON 405 with Allow', async ({ bugApi }) => {
  const res = await bugApi.send('PATCH', '/api/bugs/1', { data: {} });

  expect(res.status()).toBe(405);
  expect(res.headers()['allow']).toBe('GET, PUT, DELETE');
  expect(await res.json()).toMatchObject({ error: 'method_not_allowed' });
});

test('a body that is not JSON returns 415', async ({ bugApi }) => {
  const res = await bugApi.send('POST', '/api/bugs', { body: '{"title":"x"}', headers: { 'Content-Type': 'text/plain' } });

  expect(res.status()).toBe(415);
  expect(await res.json()).toMatchObject({ error: 'unsupported_media_type' });
});

test('an oversized body returns a JSON 413', async ({ bugApi }) => {
  const res = await bugApi.send('POST', '/api/bugs', {
    data: { title: 'big', severity: 'low', owner: 'buggy', description: 'x'.repeat(150_000) },
  });

  expect(res.status()).toBe(413);
  expect(await res.json()).toMatchObject({ error: 'payload_too_large' });
});

test('a field of the wrong type returns 400 invalid_type', async ({ bugApi }) => {
  const res = await bugApi.send('POST', '/api/bugs', { data: { title: 42, severity: 'low', owner: 'buggy', description: 'd' } });

  expect(res.status()).toBe(400);
  expect(await res.json()).toMatchObject({ error: 'invalid_type', message: 'title must be text.' });
});

test('the response to a create is the stored row', async ({ bugApi }) => {
  const res = await bugApi.createRaw({ title: `  stored row ${uid()}  `, severity: ' Low ', owner: ' buggy ', description: 'd' });
  const body = await res.json();

  expect(res.status()).toBe(201);
  expect(body).toEqual(await bugApi.get(body.id));
});

test('bare /api returns a JSON 404', async ({ bugApi }) => {
  const res = await bugApi.send('GET', '/api');

  expect(res.status()).toBe(404);
  expect(await res.json()).toMatchObject({ error: 'not_found' });
});
