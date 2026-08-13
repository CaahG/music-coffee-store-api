import { test, expect, request } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { AuthApi } from './pom/authAPI';
import { CategoriesApi } from './pom/categoriesAPI';
import { ProductsApi } from './pom/productsAPI';
import { CartApi } from './pom/cartAPI';
import { OrderApi } from './pom/OrderAPI';
import { getAdminToken, registerAndLoginCustomer } from './helpers/authHelper';
import { buildCategoryPayload, buildProductPayload } from '../fixtures/catalog';

const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';

test.describe('Orders API', () => {
  let apiContext: APIRequestContext;
  let authApi: AuthApi;
  let categoriesApi: CategoriesApi;
  let productsApi: ProductsApi;
  let cartApi: CartApi;
  let ordersApi: OrderApi;
  let adminToken: string;

  let categoryId: string;
  let customerToken: string;
  let productId: string;

  test.beforeAll(async () => {
    apiContext = await request.newContext();
    authApi = new AuthApi(apiContext);
    categoriesApi = new CategoriesApi(apiContext);
    productsApi = new ProductsApi(apiContext);
    cartApi = new CartApi(apiContext);
    ordersApi = new OrderApi(apiContext);
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

  test.describe('POST /orders', () => {
    test('checks out an order from the cart and empties the cart', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 2 });

      const response = await ordersApi.checkout(customerToken);
      const cart = await cartApi.getCart(customerToken);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('PENDING');
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0]).toMatchObject({ productId, quantity: 2 });
      expect(cart.body.items).toEqual([]);
    });

    test('decreases product stock after checkout', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 2 });
      await ordersApi.checkout(customerToken);

      const product = await productsApi.getById(productId);

      expect(product.body.stock).toBe(3);
    });

    test('rejects checkout when the cart is empty', async () => {
      const response = await ordersApi.checkout(customerToken);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('The cart is empty.');
    });

    test('rejects checkout when the requested quantity exceeds available stock', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 999 });

      const response = await ordersApi.checkout(customerToken);

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('Insufficient stock for product');
    });

    test('rejects checkout without a token', async () => {
      const response = await ordersApi.checkout(undefined);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid or missing token.');
    });
  });

  test.describe('GET /orders', () => {
    test('lists only the authenticated customer own orders', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 1 });
      const order = await ordersApi.checkout(customerToken);

      const response = await ordersApi.list(customerToken);

      expect(response.status).toBe(200);
      expect(response.body.every((o: { id: string }) => o.id !== undefined)).toBe(true);
      expect(response.body.map((o: { id: string }) => o.id)).toContain(order.body.id);
    });

    test('lets an admin list every order with ?all=true', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 1 });
      const order = await ordersApi.checkout(customerToken);

      const response = await ordersApi.list(adminToken, { all: true });

      expect(response.status).toBe(200);
      expect(response.body.map((o: { id: string }) => o.id)).toContain(order.body.id);
    });
  });

  test.describe('GET /orders/:id', () => {
    test('allows the order owner to fetch it', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 1 });
      const order = await ordersApi.checkout(customerToken);

      const response = await ordersApi.getById(customerToken, order.body.id);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(order.body.id);
    });

    test('allows an admin to fetch any order', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 1 });
      const order = await ordersApi.checkout(customerToken);

      const response = await ordersApi.getById(adminToken, order.body.id);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(order.body.id);
    });

    test('forbids a different customer from viewing someone else’s order', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 1 });
      const order = await ordersApi.checkout(customerToken);
      const { token: otherCustomerToken } = await registerAndLoginCustomer(authApi);

      const response = await ordersApi.getById(otherCustomerToken, order.body.id);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You do not have access to this order.');
    });

    test('returns 404 for an order that does not exist', async () => {
      const response = await ordersApi.getById(customerToken, NON_EXISTENT_ID);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Order not found.');
    });
  });

  test.describe('PATCH /orders/:id/status', () => {
    test('allows an admin to update the order status', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 1 });
      const order = await ordersApi.checkout(customerToken);

      const response = await ordersApi.updateStatus(adminToken, order.body.id, { status: 'CONFIRMED' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('CONFIRMED');
    });

    test('rejects status updates from a customer account', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 1 });
      const order = await ordersApi.checkout(customerToken);

      const response = await ordersApi.updateStatus(customerToken, order.body.id, { status: 'CONFIRMED' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access restricted to administrators.');
    });

    test('rejects an invalid status value', async () => {
      await cartApi.addItem(customerToken, { productId, quantity: 1 });
      const order = await ordersApi.checkout(customerToken);

      const response = await ordersApi.updateStatus(adminToken, order.body.id, { status: 'NOT_A_STATUS' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid data.');
    });

    test('returns 404 when updating the status of an order that does not exist', async () => {
      const response = await ordersApi.updateStatus(adminToken, NON_EXISTENT_ID, { status: 'CONFIRMED' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Order not found.');
    });
  });
});
