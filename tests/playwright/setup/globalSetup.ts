import { execSync } from 'node:child_process';
import { TEST_DATABASE_URL } from '../../setup/testEnv';

/*
 * Executa uma única vez antes de toda a suíte Playwright: aplica as
 * migrations e o seed (categorias, usuários admin/customer) no mesmo banco
 * de dados de teste isolado usado pela suíte Vitest. Requer que
 * `docker compose up -d postgres-test` já esteja rodando antes.
 */
export default async function globalSetup() {
  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL };

  execSync('npx prisma migrate deploy', { env, stdio: 'inherit' });
  execSync('npx prisma db seed', { env, stdio: 'inherit' });
}
