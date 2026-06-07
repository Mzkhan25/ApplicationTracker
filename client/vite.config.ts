import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages serves this project as a *project site* under /<repo>/, so the
// production build needs that base path for assets to resolve. Dev stays at '/'.
const BASE = '/ApplicationTracker/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? BASE : '/',
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
}));
