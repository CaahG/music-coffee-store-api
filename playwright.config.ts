import { defineConfig } from '@playwright/test';
import { TEST_DATABASE_URL, TEST_JWT_SECRET } from './tests/setup/testEnv';

const PORT = 3002;
const BASE_URL = `http://localhost:${PORT}`;

/*
 * Suíte de testes de API em Playwright, espelhando os cenários da suíte
 * Vitest (tests/*.spec.ts) mas batendo em requisições HTTP reais contra um
 * servidor de verdade (webServer abaixo), em vez do inject() do Fastify.
 * Roda contra o mesmo banco de teste isolado (postgres-test).
 */
export default defineConfig({
  testDir: './tests/playwright',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 15_000,
  globalSetup: require.resolve('./tests/playwright/setup/globalSetup.ts'),
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
  },
  webServer: {
    command: 'npm run dev',
    url: `${BASE_URL}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: TEST_JWT_SECRET,
      PORT: String(PORT),
      NODE_ENV: 'test',
    },
  },
});
