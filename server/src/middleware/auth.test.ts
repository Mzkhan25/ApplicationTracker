import { describe, it, expect, beforeAll } from 'vitest';
import { sign } from 'hono/jwt';
import app from '../app.js';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.CLIENT_ORIGIN = 'http://localhost:5173';
});

describe('JWT protection on /api/data', () => {
  it('returns 401 with no Authorization header', async () => {
    const res = await app.request('http://localhost/api/data');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed token', async () => {
    const res = await app.request('http://localhost/api/data', {
      headers: { Authorization: 'Bearer not-a-valid-jwt' },
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 with a token signed with the wrong secret', async () => {
    const token = await sign({ sub: 'u1', username: 'alice', exp: Math.floor(Date.now() / 1000) + 3600 }, 'wrong-secret');
    const res = await app.request('http://localhost/api/data', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });
});

describe('/health', () => {
  it('returns 200', async () => {
    const res = await app.request('http://localhost/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });
});
