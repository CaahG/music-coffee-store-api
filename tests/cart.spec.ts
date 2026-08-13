import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from './helpers/appHelper';
import { AuthApi } from './api/pom/authAPI';
import { CategoriesApi } from './api/pom/categoriesAPI';
import { ProductsApi } from './api/pom/productsAPI';
import { CartApi } from './api/pom/cartAPI';
import { getAdminToken, registerAndLoginCustomer } from './helpers/authHelper';
import { buildCategoryPayload, buildProductPayload } from './fixtures/catalog';

const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';

describe('Cart API', () => {
  /*
   * Infraestrutura pura de teste, montada uma única vez: instância da app,
   * wrappers do cliente HTTP, credenciais de admin. Nenhum teste altera isso.
   */
  let app: FastifyInstance;
  let cartApi: CartApi;
  let categoriesApi: CategoriesApi;
  let productsApi: ProductsApi;
  let authApi: AuthApi;
  let adminToken: string;

  /*
   * Recriado antes de cada teste: categoria nova, cliente novo e produto
   * novo para cada um, assim o estado de carrinho/estoque nunca vaza entre
   * cenários e cada teste pode rodar sozinho ou em qualquer ordem.
   */
  let categoryId: string;4 
  let customerToken: string;
  let productId: string;

  beforeAll(async () => {
    app = await createTestApp();
    cartApi = new CartApi(app);
    categoriesApi = new CategoriesApi(app);
    productsApi = new ProductsApi(app);
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

    const product = await productsApi.create(adminToken, buildProductPayload(categoryId, { stock: 5 }));
    productId = product.body.id;
  });

  describe('GET /cart', () => {
    it('returns an empty cart for a freshly registered customer', async () => {
      const response = await cartApi.getCart(customerToken);

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
      expect(response.body.totalCents).toBe(0);
    });

    it('rejects the request when no token is provided', async () => {
      const response = await cartApi.getCart(undefined);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid or missing token.');
    });
  });

  describe('POST /cart/items', () => {
    it('adds a product to the cart', async () => {
      const response = await cartApi.addItem(customerToken, { productId, quantity: 2 });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0]).toMatchObject({ productId, quantity: 2 });
      expect(response.body.totalCents).toBe(response.body.items[0].subtotalCents);
    });

    it('increases the quantity when the same product is added twice', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 1 });

      const response = await cartApi.addItem(customerToken, { productId, quantity: 2 });

      expect(response.status).toBe(200);
      expect(response.body.items[0].quantity).toBe(3);
    });

    it('returns 404 for a product that does not exist', async () => {
      const response = await cartApi.addItem(customerToken, { productId: NON_EXISTENT_ID, quantity: 1 });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found.');
    });
  });

  describe('PATCH /cart/items/:productId', () => {
    it('updates the quantity of an item already in the cart', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 1 });

      const response = await cartApi.updateItem(customerToken, productId, { quantity: 4 });

      expect(response.status).toBe(200);
      expect(response.body.items[0].quantity).toBe(4);
    });

    it('returns 404 when the item is not in the cart', async () => {
      const response = await cartApi.updateItem(customerToken, productId, { quantity: 2 });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Item not found in the cart.');
    });
  });

  describe('DELETE /cart/items/:productId', () => {
    it('removes an item from the cart', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 1 });

      const response = await cartApi.removeItem(customerToken, productId);

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
    });

    it('returns 404 when removing an item that is not in the cart', async () => {
      const response = await cartApi.removeItem(customerToken, productId);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Item not found in the cart.');
    });
  });

  describe('DELETE /cart', () => {
    it('empties the cart', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 3 });

      const response = await cartApi.clear(customerToken);

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
      expect(response.body.totalCents).toBe(0);
    });
  });
});
