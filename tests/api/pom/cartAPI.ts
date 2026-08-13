import { BaseApi } from './baseAPI';
import { endpoints } from '../../selectors/endpoints';

export class CartApi extends BaseApi {
  getCart(token?: string) {
    return this.request({ method: 'GET', url: endpoints.cart.root, headers: this.authHeader(token) });
  }

  addItem(token: string | undefined, payload: Record<string, unknown>) {
    return this.request({
      method: 'POST',
      url: endpoints.cart.items,
      payload,
      headers: this.authHeader(token),
    });
  }

  updateItem(token: string | undefined, productId: string, payload: Record<string, unknown>) {
    return this.request({
      method: 'PATCH',
      url: endpoints.cart.item(productId),
      payload,
      headers: this.authHeader(token),
    });
  }

  removeItem(token: string | undefined, productId: string) {
    return this.request({
      method: 'DELETE',
      url: endpoints.cart.item(productId),
      headers: this.authHeader(token),
    });
  }

  clear(token?: string) {
    return this.request({ method: 'DELETE', url: endpoints.cart.root, headers: this.authHeader(token) });
  }
}
