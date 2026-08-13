import { BaseApi } from './baseAPI';
import { endpoints } from '../../selectors/endpoints';

export class UsersApi extends BaseApi {
  me(token?: string) {
    return this.get(endpoints.users.me, this.authHeader(token));
  }
}
