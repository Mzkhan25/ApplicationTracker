import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiRepository } from './apiRepository';

const mockData = { stages: [], applications: [] };
const token = 'test-token';
const repo = new ApiRepository(token);

beforeEach(() => vi.resetAllMocks());

describe('ApiRepository.load', () => {
  it('calls GET /api/data with Authorization header', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockData) }),
    );
    const result = await repo.load();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/data'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${token}` }),
      }),
    );
    expect(result).toEqual(mockData);
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(repo.load()).rejects.toThrow('401');
  });
});

describe('ApiRepository.save', () => {
  it('calls PUT /api/data with body and Authorization header', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    await repo.save(mockData);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/data'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ Authorization: `Bearer ${token}` }),
        body: JSON.stringify(mockData),
      }),
    );
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(repo.save(mockData)).rejects.toThrow('500');
  });
});
