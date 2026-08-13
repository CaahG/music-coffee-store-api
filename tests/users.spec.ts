import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from './helpers/appHelper';
import { AuthApi } from './api/pom/authAPI';
import { UsersApi } from './api/pom/usersAPI';
import { registerAndLoginCustomer } from './helpers/authHelper';

describe('Users API', () => {
  let app: FastifyInstance;
  let usersApi: UsersApi;
  let authApi: AuthApi;

  beforeAll(async () => {
    app = await createTestApp();
    usersApi = new UsersApi(app);
    authApi = new AuthApi(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users/me', () => {
    it('returns the authenticated user data', async () => {
      const { token, user } = await registerAndLoginCustomer(authApi);

      const response = await usersApi.me(token);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'CUSTOMER',
      });
    });

    it('rejects the request when no token is provided', async () => {
      const response = await usersApi.me(undefined);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid or missing token.');
    });

    it('rejects the request when the token is malformed', async () => {
      const response = await usersApi.me('this-is-not-a-valid-jwt');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid or missing token.');
    });
  });
});
