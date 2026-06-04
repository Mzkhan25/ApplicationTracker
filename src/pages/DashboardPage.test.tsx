import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { useAppStore } from '../store/useAppStore';

describe('DashboardPage', () => {
  beforeEach(async () => {
    await useAppStore.getState().init();
  });

  it('renders all four widgets from seeded data', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    for (const title of [
      'Applications by stage',
      'Pipeline funnel',
      'Recent activity',
      'Follow-up reminders',
    ]) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
  });

  it('surfaces the stale seeded application as a follow-up', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    // Globex was last updated 12 days ago in the seed → stale (> 7 days).
    const followUps = screen
      .getByRole('heading', { name: 'Follow-up reminders' })
      .closest('section')!;
    expect(within(followUps).getByText('Globex')).toBeInTheDocument();
    expect(within(followUps).getByText('1 due')).toBeInTheDocument();
  });
});
