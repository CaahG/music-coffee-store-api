import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from './helpers/appHelper';
import { AuthApi } from './api/pom/authAPI';
import { CategoriesApi } from './api/pom/categoriesAPI';
import { ProductsApi } from './api/pom/productsAPI';
import { getAdminToken, registerAndLoginCustomer } from './helpers/authHelper';
import { buildCategoryPayload, buildProductPayload } from './fixtures/catalog';

const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';

describe('Products API', () => {
  /*
   * Montado uma única vez: infraestrutura pura de teste (instância da app,
   * wrappers do cliente HTTP, credenciais de admin). Nada aqui é dado que um
   * teste possa alterar ou que outro teste possa acabar dependendo.
   */
  let app: FastifyInstance;
  let productsApi: ProductsApi;
  let categoriesApi: CategoriesApi;
  let authApi: AuthApi;
  let adminToken: string;

  /*
   * Recriado antes de cada teste: cada teste recebe sua própria categoria e
   * sua própria conta de cliente, assim nenhum teste enxerga dado criado por
   * outro e cada um pode rodar sozinho ou em qualquer ordem.
   */
  let categoryId: string;
  let customerToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    productsApi = new ProductsApi(app);
    categoriesApi = new CategoriesApi(app);
    authApi = new AuthApi(app);
    adminToken = await getAdminToken(authApi);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const category = await categoriesApi.create(adminToken, buildCategoryPayload());
    categoryId = category.body.id;

    ({ token: customerToken } = await registerAndLoginCustomer(authApi));
  });

  describe('GET /products', () => {
    it('lists products with pagination metadata', async () => {
      await productsApi.create(adminToken, buildProductPayload(categoryId));

      const response = await productsApi.list();

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ page: 1, limit: 20 });
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('filters products by category slug', async () => {
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

  describe('GET /products/:id', () => {
    it('returns a product by id', async () => {
      const created = await productsApi.create(adminToken, buildProductPayload(categoryId));

      const response = await productsApi.getById(created.body.id);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ id: created.body.id, name: created.body.name });
    });

    it('returns 404 for a product that does not exist', async () => {
      const response = await productsApi.getById(NON_EXISTENT_ID);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found.');
    });
  });

  describe('POST /products', () => {
    it('allows an admin to create a product', async () => {
      const payload = buildProductPayload(categoryId);

      const response = await productsApi.create(adminToken, payload);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: payload.name,
        priceCents: payload.priceCents,
        stock: payload.stock,
      });
    });

    it('rejects creation from a customer account', async () => {
      const response = await productsApi.create(customerToken, buildProductPayload(categoryId));

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access restricted to administrators.');
    });

    it('rejects creation without a token', async () => {
      const response = await productsApi.create(undefined, buildProductPayload(categoryId));

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid or missing token.');
    });

    it('rejects creation referencing a category that does not exist', async () => {
      const response = await productsApi.create(adminToken, buildProductPayload(NON_EXISTENT_ID));

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('The specified category does not exist.');
    });

    it('rejects creation with missing required fields', async () => {
      const response = await productsApi.create(adminToken, { name: 'Incomplete product' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid data.');
    });
  });

  describe('PATCH /products/:id', () => {
    it('allows an admin to update a product', async () => {
      const created = await productsApi.create(adminToken, buildProductPayload(categoryId));

      const response = await productsApi.update(adminToken, created.body.id, { priceCents: 9999 });

      expect(response.status).toBe(200);
      expect(response.body.priceCents).toBe(9999);
    });

    it('returns 404 when updating a product that does not exist', async () => {
      const response = await productsApi.update(adminToken, NON_EXISTENT_ID, { priceCents: 100 });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found.');
    });

    it('rejects updates from a customer account', async () => {
      const created = await productsApi.create(adminToken, buildProductPayload(categoryId));

      const response = await productsApi.update(customerToken, created.body.id, { priceCents: 1 });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access restricted to administrators.');
    });
  });

  describe('DELETE /products/:id', () => {
    it('allows an admin to delete a product', async () => {
      const created = await productsApi.create(adminToken, buildProductPayload(categoryId));

      const deleteResponse = await productsApi.remove(adminToken, created.body.id);
      const getResponse = await productsApi.getById(created.body.id);

      expect(deleteResponse.status).toBe(204);
      expect(getResponse.status).toBe(404);
    });

    it('rejects deletion from a customer account', async () => {
      const created = await productsApi.create(adminToken, buildProductPayload(categoryId));

      const response = await productsApi.remove(customerToken, created.body.id);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access restricted to administrators.');
    });
  });
});
