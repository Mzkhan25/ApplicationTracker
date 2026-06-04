import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HelpPage from './HelpPage';

describe('HelpPage', () => {
  it('renders the title and a section for every feature area', () => {
    render(
      <MemoryRouter>
        <HelpPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'How to use', level: 1 })).toBeInTheDocument();
    for (const section of [
      'The basics',
      'Adding & editing applications',
      'Moving applications between stages',
      'Customizing the pipeline (columns)',
      'Follow-up reminders',
      'Reading the dashboard',
      'Your data & privacy',
    ]) {
      expect(screen.getByRole('heading', { name: section })).toBeInTheDocument();
    }
  });
});
