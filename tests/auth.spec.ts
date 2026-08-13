import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from './helpers/appHelper';
import { AuthApi } from './api/pom/authAPI';
import { buildCustomerPayload } from './fixtures/users';

describe('Auth API', () => {
  let app: FastifyInstance;
  let authApi: AuthApi;

  beforeAll(async () => {
    app = await createTestApp();
    authApi = new AuthApi(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('registers a new customer with valid data', async () => {
      const payload = buildCustomerPayload();

      const response = await authApi.register(payload);

      expect(response.status).toBe(201);
      expect(response.body.token).toEqual(expect.any(String));
      expect(response.body.user).toMatchObject({
        name: payload.name,
        email: payload.email,
        role: 'CUSTOMER',
      });
    });

    it('rejects registration when the email is already in use', async () => {
      const payload = buildCustomerPayload();
      await authApi.register(payload);

      const response = await authApi.register(payload);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('An account with this email already exists.');
    });

    it('rejects registration with a malformed email', async () => {
      const payload = buildCustomerPayload({ email: 'not-an-email' });

      const response = await authApi.register(payload);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid data.');
    });

    it('rejects registration with a password shorter than 6 characters', async () => {
      const payload = buildCustomerPayload({ password: '123' });

      const response = await authApi.register(payload);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid data.');
    });
  });

  describe('POST /auth/login', () => {
    it('authenticates a registered user with valid credentials', async () => {
      const payload = buildCustomerPayload();
      await authApi.register(payload);

      const response = await authApi.login({ email: payload.email, password: payload.password });

      expect(response.status).toBe(200);
      expect(response.body.token).toEqual(expect.any(String));
      expect(response.body.user.email).toBe(payload.email);
    });

    it('rejects login with the wrong password', async () => {
      const payload = buildCustomerPayload();
      await authApi.register(payload);

      const response = await authApi.login({ email: payload.email, password: 'wrong-password' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password.');
    });

    it('rejects login for an email that was never registered', async () => {
      const response = await authApi.login({ email: 'nobody@example.com', password: 'whatever123' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password.');
    });
  });
});
