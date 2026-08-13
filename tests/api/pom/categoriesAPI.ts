import { BaseApi } from './baseAPI';
import { endpoints } from '../../selectors/endpoints';

export class CategoriesApi extends BaseApi {
  list() {
    return this.request({ method: 'GET', url: endpoints.categories.list });
  }

  getById(id: string) {
    return this.request({ method: 'GET', url: endpoints.categories.byId(id) });
  }

  create(token: string | undefined, payload: Record<string, unknown>) {
    return this.request({
      method: 'POST',
      url: endpoints.categories.list,
      payload,
      headers: this.authHeader(token),
    });
  }

  update(token: string | undefined, id: string, payload: Record<string, unknown>) {
    return this.request({
      method: 'PATCH',
      url: endpoints.categories.byId(id),
      payload,
      headers: this.authHeader(token),
    });
  }

  remove(token: string | undefined, id: string) {
    return this.request({
      method: 'DELETE',
      url: endpoints.categories.byId(id),
      headers: this.authHeader(token),
    });
  }
}
