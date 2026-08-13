import { BaseApi } from './baseAPI';
import { endpoints } from '../../selectors/endpoints';

export class OrderApi extends BaseApi {
  checkout(token?: string) {
    return this.request({ method: 'POST', url: endpoints.orders.root, headers: this.authHeader(token) });
  }

  list(token: string | undefined, query: Record<string, unknown> = {}) {
    return this.request({
      method: 'GET',
      url: endpoints.orders.root,
      query: query as Record<string, string>,
      headers: this.authHeader(token),
    });
  }

  getById(token: string | undefined, id: string) {
    return this.request({ method: 'GET', url: endpoints.orders.byId(id), headers: this.authHeader(token) });
  }

  updateStatus(token: string | undefined, id: string, payload: Record<string, unknown>) {
    return this.request({
      method: 'PATCH',
      url: endpoints.orders.status(id),
      payload,
      headers: this.authHeader(token),
    });
  }
}
