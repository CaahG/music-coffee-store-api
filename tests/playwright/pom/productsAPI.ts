import { BaseApi } from './baseAPI';
import { endpoints } from '../../selectors/endpoints';

export class ProductsApi extends BaseApi {
  list(query: Record<string, unknown> = {}) {
    return this.get(endpoints.products.list, undefined, query as Record<string, string | number | boolean>);
  }

  getById(id: string) {
    return this.get(endpoints.products.byId(id));
  }

  create(token: string | undefined, payload: Record<string, unknown>) {
    return this.post(endpoints.products.list, payload, this.authHeader(token));
  }

  update(token: string | undefined, id: string, payload: Record<string, unknown>) {
    return this.patch(endpoints.products.byId(id), payload, this.authHeader(token));
  }

  remove(token: string | undefined, id: string) {
    return this.delete(endpoints.products.byId(id), this.authHeader(token));
  }
}
