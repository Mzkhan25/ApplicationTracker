import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BoardPage from './BoardPage';
import { useAppStore } from '../store/useAppStore';

const renderBoard = () =>
  render(
    <MemoryRouter>
      <BoardPage />
    </MemoryRouter>,
  );

describe('BoardPage', () => {
  beforeEach(async () => {
    await useAppStore.getState().init();
  });

  it('renders the default columns and seeded cards', async () => {
    renderBoard();
    for (const name of ['Applied', 'Phone Screen', 'Interview', 'Offer']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('adds a new application through the modal', async () => {
    const user = userEvent.setup();
    renderBoard();

    await user.click(screen.getByRole('button', { name: '+ New application' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Company *'), 'Hooli');
    await user.type(within(dialog).getByLabelText('Role *'), 'Platform Engineer');
    await user.click(within(dialog).getByRole('button', { name: 'Add application' }));

    expect(screen.getByText('Hooli')).toBeInTheDocument();
    // Persisted to the store.
    expect(
      useAppStore.getState().applications.some((a) => a.company === 'Hooli'),
    ).toBe(true);
  });
});
