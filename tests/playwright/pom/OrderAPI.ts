import { BaseApi } from './baseAPI';
import { endpoints } from '../../selectors/endpoints';

export class OrderApi extends BaseApi {
  checkout(token?: string) {
    return this.post(endpoints.orders.root, undefined, this.authHeader(token));
  }

  list(token: string | undefined, query: Record<string, unknown> = {}) {
    return this.get(endpoints.orders.root, this.authHeader(token), query as Record<string, string | number | boolean>);
  }

  getById(token: string | undefined, id: string) {
    return this.get(endpoints.orders.byId(id), this.authHeader(token));
  }

  updateStatus(token: string | undefined, id: string, payload: Record<string, unknown>) {
    return this.patch(endpoints.orders.status(id), payload, this.authHeader(token));
  }
}
