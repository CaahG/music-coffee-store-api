import { test, expect, request } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { AuthApi } from './pom/authAPI';
import { buildCustomerPayload } from '../fixtures/users';

test.describe('Auth API', () => {
  let apiContext: APIRequestContext;
  let authApi: AuthApi;

  test.beforeAll(async () => {
    apiContext = await request.newContext();
    authApi = new AuthApi(apiContext);
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test.describe('POST /auth/register', () => {
    test('registers a new customer with valid data', async () => {
      const payload = buildCustomerPayload();

      const response = await authApi.register(payload);

      expect(response.status).toBe(201);
      expect(typeof response.body.token).toBe('string');
      expect(response.body.user).toMatchObject({
        name: payload.name,
        email: payload.email,
        role: 'CUSTOMER',
      });
    });

    test('rejects registration when the email is already in use', async () => {
      const payload = buildCustomerPayload();
      await authApi.register(payload);

      const response = await authApi.register(payload);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('An account with this email already exists.');
    });

    test('rejects registration with a malformed email', async () => {
      const payload = buildCustomerPayload({ email: 'not-an-email' });

      const response = await authApi.register(payload);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid data.');
    });

    test('rejects registration with a password shorter than 6 characters', async () => {
      const payload = buildCustomerPayload({ password: '123' });

      const response = await authApi.register(payload);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid data.');
    });
  });

  test.describe('POST /auth/login', () => {
    test('authenticates a registered user with valid credentials', async () => {
      const payload = buildCustomerPayload();
      await authApi.register(payload);

      const response = await authApi.login({ email: payload.email, password: payload.password });

      expect(response.status).toBe(200);
      expect(typeof response.body.token).toBe('string');
      expect(response.body.user.email).toBe(payload.email);
    });

    test('rejects login with the wrong password', async () => {
      const payload = buildCustomerPayload();
      await authApi.register(payload);

      const response = await authApi.login({ email: payload.email, password: 'wrong-password' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password.');
    });

    test('rejects login for an email that was never registered', async () => {
      const response = await authApi.login({ email: 'nobody@example.com', password: 'whatever123' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password.');
    });
  });
});
