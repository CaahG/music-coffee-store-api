import { BaseApi } from './baseAPI';
import { endpoints } from '../../selectors/endpoints';

export class UsersApi extends BaseApi {
  me(token?: string) {
    return this.request({
      method: 'GET',
      url: endpoints.users.me,
      headers: this.authHeader(token),
    });
  }
}
