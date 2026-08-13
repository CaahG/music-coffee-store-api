import { BaseApi } from './baseAPI';
import { endpoints } from '../../selectors/endpoints';

export class ProductsApi extends BaseApi {
  list(query: Record<string, unknown> = {}) {
    return this.request({ method: 'GET', url: endpoints.products.list, query: query as Record<string, string> });
  }

  getById(id: string) {
    return this.request({ method: 'GET', url: endpoints.products.byId(id) });
  }

  create(token: string | undefined, payload: Record<string, unknown>) {
    return this.request({
      method: 'POST',
      url: endpoints.products.list,
      payload,
      headers: this.authHeader(token),
    });
  }

  update(token: string | undefined, id: string, payload: Record<string, unknown>) {
    return this.request({
      method: 'PATCH',
      url: endpoints.products.byId(id),
      payload,
      headers: this.authHeader(token),
    });
  }

  remove(token: string | undefined, id: string) {
    return this.request({
      method: 'DELETE',
      url: endpoints.products.byId(id),
      headers: this.authHeader(token),
    });
  }
}
