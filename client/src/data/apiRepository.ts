import type { TrackerData } from '../types';
import type { TrackerRepository } from './repository';

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export class ApiRepository implements TrackerRepository {
  private readonly token: string;
  constructor(token: string) {
    this.token = token;
  }

  async load(): Promise<TrackerData> {
    const res = await fetch(`${API_BASE}/api/data`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
    return res.json() as Promise<TrackerData>;
  }

  async save(data: TrackerData): Promise<void> {
    const res = await fetch(`${API_BASE}/api/data`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to save: ${res.status}`);
  }
}
