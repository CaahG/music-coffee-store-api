import { test, expect, request } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { AuthApi } from './pom/authAPI';
import { CategoriesApi } from './pom/categoriesAPI';
import { ProductsApi } from './pom/productsAPI';
import { CartApi } from './pom/cartAPI';
import { getAdminToken, registerAndLoginCustomer } from './helpers/authHelper';
import { buildCategoryPayload, buildProductPayload } from '../fixtures/catalog';

const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';

test.describe('Cart API', () => {
  let apiContext: APIRequestContext;
  let cartApi: CartApi;
  let categoriesApi: CategoriesApi;
  let productsApi: ProductsApi;
  let authApi: AuthApi;
  let adminToken: string;

  let categoryId: string;
  let customerToken: string;
  let productId: string;

  test.beforeAll(async () => {
    apiContext = await request.newContext();
    cartApi = new CartApi(apiContext);
    categoriesApi = new CategoriesApi(apiContext);
    productsApi = new ProductsApi(apiContext);
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

    const product = await productsApi.create(adminToken, buildProductPayload(categoryId, { stock: 5 }));
    productId = product.body.id;
  });

  test.describe('GET /cart', () => {
    test('returns an empty cart for a freshly registered customer', async () => {
      const response = await cartApi.getCart(customerToken);

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
      expect(response.body.totalCents).toBe(0);
    });

    test('rejects the request when no token is provided', async () => {
      const response = await cartApi.getCart(undefined);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid or missing token.');
    });
  });

  test.describe('POST /cart/items', () => {
    test('adds a product to the cart', async () => {
      const response = await cartApi.addItem(customerToken, { productId, quantity: 2 });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0]).toMatchObject({ productId, quantity: 2 });
      expect(response.body.totalCents).toBe(response.body.items[0].subtotalCents);
    });

    test('increases the quantity when the same product is added twice', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 1 });

      const response = await cartApi.addItem(customerToken, { productId, quantity: 2 });

      expect(response.status).toBe(200);
      expect(response.body.items[0].quantity).toBe(3);
    });

    test('returns 404 for a product that does not exist', async () => {
      const response = await cartApi.addItem(customerToken, { productId: NON_EXISTENT_ID, quantity: 1 });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found.');
    });
  });

  test.describe('PATCH /cart/items/:productId', () => {
    test('updates the quantity of an item already in the cart', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 1 });

      const response = await cartApi.updateItem(customerToken, productId, { quantity: 4 });

      expect(response.status).toBe(200);
      expect(response.body.items[0].quantity).toBe(4);
    });

    test('returns 404 when the item is not in the cart', async () => {
      const response = await cartApi.updateItem(customerToken, productId, { quantity: 2 });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Item not found in the cart.');
    });
  });

  test.describe('DELETE /cart/items/:productId', () => {
    test('removes an item from the cart', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 1 });

      const response = await cartApi.removeItem(customerToken, productId);

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
    });

    test('returns 404 when removing an item that is not in the cart', async () => {
      const response = await cartApi.removeItem(customerToken, productId);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Item not found in the cart.');
    });
  });

  test.describe('DELETE /cart', () => {
    test('empties the cart', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 3 });

      const response = await cartApi.clear(customerToken);

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
      expect(response.body.totalCents).toBe(0);
    });
  });
});
