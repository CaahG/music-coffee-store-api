import { buildApp } from './app';
import { env } from './config/env';

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ host: '0.0.0.0', port: env.PORT });
    app.log.info(`Swagger UI available at http://localhost:${env.PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
