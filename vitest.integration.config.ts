import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.integration.test.ts'],
    // Container pull/start can take a while on a cold Docker cache.
    testTimeout: 30_000,
    hookTimeout: 60_000
  }
});
