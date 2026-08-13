import { test, expect, request } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { AuthApi } from './pom/authAPI';
import { CategoriesApi } from './pom/categoriesAPI';
import { ProductsApi } from './pom/productsAPI';
import { getAdminToken, registerAndLoginCustomer } from './helpers/authHelper';
import { buildCategoryPayload, buildProductPayload } from '../fixtures/catalog';

const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';

test.describe('Products API', () => {
  let apiContext: APIRequestContext;
  let productsApi: ProductsApi;
  let categoriesApi: CategoriesApi;
  let authApi: AuthApi;
  let adminToken: string;

  let categoryId: string;
  let customerToken: string;

  test.beforeAll(async () => {
    apiContext = await request.newContext();
    productsApi = new ProductsApi(apiContext);
    categoriesApi = new CategoriesApi(apiContext);
    authApi = new AuthApi(apiContext);
    adminToken = await getAdminToken(authApi);
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test.beforeEach(async () => {
    const category = await categoriesApi.create(adminToken, buildCategoryPayload());
    categoryId = category.body.id;

    ({ token: customerToken } = await registerAndLoginCustomer(authApi));
  });

  test.describe('GET /products', () => {
    test('lists products with pagination metadata', async () => {
      await productsApi.create(adminToken, buildProductPayload(categoryId));

      const response = await productsApi.list();

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ page: 1, limit: 20 });
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
    });

    test('filters products by category slug', async () => {
      const created = await productsApi.create(adminToken, buildProductPayload(categoryId));
      const category = await categoriesApi.getById(categoryId);

      const response = await productsApi.list({ category: category.body.slug });

      expect(response.status).toBe(200);
      expect(response.body.data.map((product: { id: string }) => product.id)).toContain(created.body.id);
      expect(
        response.body.data.every((product: { categoryId: string }) => product.categoryId === categoryId),
      ).toBe(true);
    });
  });

  test.describe('GET /products/:id', () => {
    test('returns a product by id', async () => {
      const created = await productsApi.create(adminToken, buildProductPayload(categoryId));

      const response = await productsApi.getById(created.body.id);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ id: created.body.id, name: created.body.name });
    });

    test('returns 404 for a product that does not exist', async () => {
      const response = await productsApi.getById(NON_EXISTENT_ID);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found.');
    });
  });

  test.describe('POST /products', () => {
    test('allows an admin to create a product', async () => {
      const payload = buildProductPayload(categoryId);

      const response = await productsApi.create(adminToken, payload);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: payload.name,
        priceCents: payload.priceCents,
        stock: payload.stock,
      });
    });

    test('rejects creation from a customer account', async () => {
      const response = await productsApi.create(customerToken, buildProductPayload(categoryId));

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access restricted to administrators.');
    });

    test('rejects creation without a token', async () => {
      const response = await productsApi.create(undefined, buildProductPayload(categoryId));

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid or missing token.');
    });

    test('rejects creation referencing a category that does not exist', async () => {
      const response = await productsApi.create(adminToken, buildProductPayload(NON_EXISTENT_ID));

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('The specified category does not exist.');
    });

    test('rejects creation with missing required fields', async () => {
      const response = await productsApi.create(adminToken, { name: 'Incomplete product' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid data.');
    });
  });

  test.describe('PATCH /products/:id', () => {
    test('allows an admin to update a product', async () => {
      const created = await productsApi.create(adminToken, buildProductPayload(categoryId));

      const response = await productsApi.update(adminToken, created.body.id, { priceCents: 9999 });

      expect(response.status).toBe(200);
      expect(response.body.priceCents).toBe(9999);
    });

    test('returns 404 when updating a product that does not exist', async () => {
      const response = await productsApi.update(adminToken, NON_EXISTENT_ID, { priceCents: 100 });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found.');
    });

    test('rejects updates from a customer account', async () => {
      const created = await productsApi.create(adminToken, buildProductPayload(categoryId));

      const response = await productsApi.update(customerToken, created.body.id, { priceCents: 1 });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access restricted to administrators.');
    });
  });

  test.describe('DELETE /products/:id', () => {
    test('allows an admin to delete a product', async () => {
      const created = await productsApi.create(adminToken, buildProductPayload(categoryId));

      const deleteResponse = await productsApi.remove(adminToken, created.body.id);
      const getResponse = await productsApi.getById(created.body.id);

      expect(deleteResponse.status).toBe(204);
      expect(getResponse.status).toBe(404);
    });

    test('rejects deletion from a customer account', async () => {
      const created = await productsApi.create(adminToken, buildProductPayload(categoryId));

      const response = await productsApi.remove(customerToken, created.body.id);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access restricted to administrators.');
    });
  });
});
