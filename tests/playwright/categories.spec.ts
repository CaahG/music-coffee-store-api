import { randomUUID } from 'node:crypto';
import { test, expect, request } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { AuthApi } from './pom/authAPI';
import { CategoriesApi } from './pom/categoriesAPI';
import { getAdminToken, registerAndLoginCustomer } from './helpers/authHelper';
import { buildCategoryPayload } from '../fixtures/catalog';

const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';

test.describe('Categories API', () => {
  let apiContext: APIRequestContext;
  let categoriesApi: CategoriesApi;
  let authApi: AuthApi;
  let adminToken: string;
  let customerToken: string;

  test.beforeAll(async () => {
    apiContext = await request.newContext();
    categoriesApi = new CategoriesApi(apiContext);
    authApi = new AuthApi(apiContext);
    adminToken = await getAdminToken(authApi);
    ({ token: customerToken } = await registerAndLoginCustomer(authApi));
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test.describe('GET /categories', () => {
    test('lists the categories seeded for the store', async () => {
      const response = await categoriesApi.list();

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((category: { name: string }) => category.name === 'Coffee')).toBe(true);
    });
  });

  test.describe('GET /categories/:id', () => {
    test('returns a category by id', async () => {
      const created = await categoriesApi.create(adminToken, buildCategoryPayload());

      const response = await categoriesApi.getById(created.body.id);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ id: created.body.id, name: created.body.name });
    });

    test('returns 404 for a category that does not exist', async () => {
      const response = await categoriesApi.getById(NON_EXISTENT_ID);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Category not found.');
    });
  });

  test.describe('POST /categories', () => {
    test('allows an admin to create a category', async () => {
      const payload = buildCategoryPayload();

      const response = await categoriesApi.create(adminToken, payload);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ name: payload.name });
      expect(typeof response.body.slug).toBe('string');
    });

    test('rejects a duplicate category name', async () => {
      const payload = buildCategoryPayload();
      await categoriesApi.create(adminToken, payload);

      const response = await categoriesApi.create(adminToken, payload);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('A category with this name already exists.');
    });

    test('rejects creation from a customer account', async () => {
      const response = await categoriesApi.create(customerToken, buildCategoryPayload());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access restricted to administrators.');
    });

    test('rejects creation without a token', async () => {
      const response = await categoriesApi.create(undefined, buildCategoryPayload());

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid or missing token.');
    });
  });

  test.describe('PATCH /categories/:id', () => {
    test('allows an admin to rename a category', async () => {
      const created = await categoriesApi.create(adminToken, buildCategoryPayload());
      const newName = `Renamed Category ${randomUUID()}`;

      const response = await categoriesApi.update(adminToken, created.body.id, { name: newName });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(newName);
    });

    test('returns 404 when updating a category that does not exist', async () => {
      const response = await categoriesApi.update(adminToken, NON_EXISTENT_ID, { name: 'Ghost' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Category not found.');
    });

    test('rejects updates from a customer account', async () => {
      const created = await categoriesApi.create(adminToken, buildCategoryPayload());

      const response = await categoriesApi.update(customerToken, created.body.id, { name: 'Hacked' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access restricted to administrators.');
    });
  });

  test.describe('DELETE /categories/:id', () => {
    test('allows an admin to delete a category', async () => {
      const created = await categoriesApi.create(adminToken, buildCategoryPayload());

      const deleteResponse = await categoriesApi.remove(adminToken, created.body.id);
      const getResponse = await categoriesApi.getById(created.body.id);

      expect(deleteResponse.status).toBe(204);
      expect(getResponse.status).toBe(404);
    });

    test('rejects deletion from a customer account', async () => {
      const created = await categoriesApi.create(adminToken, buildCategoryPayload());

      const response = await categoriesApi.remove(customerToken, created.body.id);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access restricted to administrators.');
    });
  });
});
