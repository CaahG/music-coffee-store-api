import { test, expect, request } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { AuthApi } from './pom/authAPI';
import { UsersApi } from './pom/usersAPI';
import { registerAndLoginCustomer } from './helpers/authHelper';

test.describe('Users API', () => {
  let apiContext: APIRequestContext;
  let usersApi: UsersApi;
  let authApi: AuthApi;

  test.beforeAll(async () => {
    apiContext = await request.newContext();
    usersApi = new UsersApi(apiContext);
    authApi = new AuthApi(apiContext);
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test.describe('GET /users/me', () => {
    test('returns the authenticated user data', async () => {
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

    test('rejects the request when no token is provided', async () => {
      const response = await usersApi.me(undefined);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid or missing token.');
    });

    test('rejects the request when the token is malformed', async () => {
      const response = await usersApi.me('this-is-not-a-valid-jwt');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid or missing token.');
    });
  });
});
