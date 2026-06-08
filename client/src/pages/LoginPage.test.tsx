import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from './LoginPage';

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: (selector: (s: { login: unknown; register: unknown }) => unknown) =>
    selector({ login: vi.fn(), register: vi.fn() }),
}));

describe('LoginPage', () => {
  it('renders sign in form by default', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('toggles to register mode', async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
  });
});
