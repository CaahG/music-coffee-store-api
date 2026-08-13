import { BaseApi } from './baseAPI';
import { endpoints } from '../../selectors/endpoints';

export class CategoriesApi extends BaseApi {
  list() {
    return this.get(endpoints.categories.list);
  }

  getById(id: string) {
    return this.get(endpoints.categories.byId(id));
  }

  create(token: string | undefined, payload: Record<string, unknown>) {
    return this.post(endpoints.categories.list, payload, this.authHeader(token));
  }

  update(token: string | undefined, id: string, payload: Record<string, unknown>) {
    return this.patch(endpoints.categories.byId(id), payload, this.authHeader(token));
  }

  remove(token: string | undefined, id: string) {
    return this.delete(endpoints.categories.byId(id), this.authHeader(token));
  }
}
