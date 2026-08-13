import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL, TEST_JWT_SECRET } from './tests/setup/testEnv';

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    exclude: ['**/node_modules/**', 'tests/playwright/**'],
    globalSetup: ['./tests/setup/globalSetup.ts'],
    // The suite runs against a single shared Postgres instance, so test
    // files must not run concurrently against it.
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 15000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: TEST_JWT_SECRET,
      PORT: '3001',
      NODE_ENV: 'test',
    },
  },
});
