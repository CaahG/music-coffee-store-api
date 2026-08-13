import { BaseApi } from './baseAPI';
import { endpoints } from '../../selectors/endpoints';

export class CartApi extends BaseApi {
  getCart(token?: string) {
    return this.get(endpoints.cart.root, this.authHeader(token));
  }

  addItem(token: string | undefined, payload: Record<string, unknown>) {
    return this.post(endpoints.cart.items, payload, this.authHeader(token));
  }

  updateItem(token: string | undefined, productId: string, payload: Record<string, unknown>) {
    return this.patch(endpoints.cart.item(productId), payload, this.authHeader(token));
  }

  removeItem(token: string | undefined, productId: string) {
    return this.delete(endpoints.cart.item(productId), this.authHeader(token));
  }

  clear(token?: string) {
    return this.delete(endpoints.cart.root, this.authHeader(token));
  }
}
